import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { resolveActiveStudent } from "@/features/auth/lib/university-identity";
import { uatDisplayName, uatPrivateName } from "@/features/auth/lib/uat-display-name";
import { activeUniversitySlug } from "@/features/community/lib/active-community";

const keycloakConfigured = Boolean(
  process.env.AUTH_KEYCLOAK_ID &&
    process.env.AUTH_KEYCLOAK_SECRET &&
    process.env.AUTH_KEYCLOAK_ISSUER,
);

const providers = keycloakConfigured
  ? [
      Keycloak({
        ...(activeUniversitySlug === "uat" ? { authorization: { params: { scope: "openid" } } } : {}),
        profile: async (rawProfile) => {
          const profile = rawProfile as Record<string, unknown>;
          const university = await resolveActiveStudent(profile);
          const subject = profile.sub;
          const email = university?.slug === "uat"
            ? null
            : typeof profile.email === "string" && profile.email.trim()
              ? profile.email.trim()
              : null;

          if (
            !university ||
            typeof subject !== "string" ||
            (university.slug !== "uat" && !email)
          ) {
            throw new Error("Institutional identity could not be verified.");
          }

          const fullName = [profile.given_name, profile.family_name]
            .filter((part): part is string => typeof part === "string")
            .join(" ")
            .trim();

          return {
            id: subject,
            name: university.slug === "uat"
              ? uatDisplayName(profile) ?? "Estudiante UAT"
              : typeof profile.name === "string" ? profile.name : fullName || null,
            email,
            image:
              typeof profile.picture === "string" ? profile.picture : null,
            universityId: university.id,
            role: "STUDENT" as const,
            status: "ACTIVE" as const,
          };
        },
      }),
    ]
  : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "database",
    ...(activeUniversitySlug === "uat" ? { maxAge: 8 * 60 * 60, updateAge: 8 * 60 * 60 } : {}),
  },
  pages: { signIn: "/ingresar" },
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "keycloak" || !user.id || !profile || profile.sub !== account.providerAccountId) return;
      const university = await resolveActiveStudent(profile as Record<string, unknown>);
      const fullName = uatPrivateName(profile as Record<string, unknown>);
      if (university?.slug !== "uat" || !fullName) return;
      const linked = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider: "keycloak", providerAccountId: account.providerAccountId } },
        select: { userId: true },
      });
      if (linked?.userId !== user.id) return;
      const eligible = await prisma.user.findFirst({
        where: { id: user.id, universityId: university.id, role: "STUDENT", status: "ACTIVE", isDemo: false },
        select: { id: true },
      });
      if (!eligible) return;
      await prisma.studentPrivateProfile.upsert({
        where: { userId: eligible.id },
        create: { userId: eligible.id, fullName },
        update: { fullName },
      });
    },
  },
  callbacks: {
    async signIn({ user, account, profile }): Promise<boolean> {
      if (
        account?.provider !== "keycloak" ||
        !account.providerAccountId ||
        !user.id ||
        !profile ||
        typeof profile !== "object"
      ) {
        return false;
      }

      const identityProfile = profile as Record<string, unknown>;
      if (identityProfile.sub !== account.providerAccountId) return false;

      const currentUniversity = await resolveActiveStudent(identityProfile);
      if (!currentUniversity) return false;

      // Do not link a different portal identity to an existing app session.
      const currentSession = await auth();
      if (currentSession?.user?.id) {
        const linkedAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "keycloak",
              providerAccountId: account.providerAccountId,
            },
          },
          select: { userId: true },
        });
        if (linkedAccount?.userId !== currentSession.user.id) return false;
      }

      const localUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { university: true },
      });

      if (!localUser) {
        return (
          user.universityId === currentUniversity.id &&
          user.role === "STUDENT" &&
          user.status === "ACTIVE"
        );
      }

      const allowed = (
        localUser.universityId === currentUniversity.id &&
        !localUser.isDemo &&
        localUser.status === "ACTIVE" &&
        localUser.role === "STUDENT" &&
        localUser.university.status === "ACTIVE" &&
        !localUser.university.isDemo
      );
      const displayName = currentUniversity.slug === "uat" ? uatDisplayName(identityProfile) : null;
      if (allowed && displayName && localUser.name !== displayName) {
        await prisma.user.update({ where: { id: localUser.id }, data: { name: displayName } });
        user.name = displayName;
      }
      return allowed;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.universityId = user.universityId;
        session.user.role = user.role;
        session.user.status = user.status;
      }
      return session;
    },
  },
});
