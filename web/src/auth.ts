import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { resolveActiveStudent } from "@/lib/university-identity";

const keycloakConfigured = Boolean(
  process.env.AUTH_KEYCLOAK_ID &&
    process.env.AUTH_KEYCLOAK_SECRET &&
    process.env.AUTH_KEYCLOAK_ISSUER,
);

const providers = keycloakConfigured
  ? [
      Keycloak({
        profile: async (rawProfile) => {
          const profile = rawProfile as Record<string, unknown>;
          const university = await resolveActiveStudent(profile);
          const subject = profile.sub;
          const email = profile.email;

          if (
            !university ||
            typeof subject !== "string" ||
            typeof email !== "string" ||
            email.length === 0
          ) {
            throw new Error("Institutional identity could not be verified.");
          }

          const fullName = [profile.given_name, profile.family_name]
            .filter((part): part is string => typeof part === "string")
            .join(" ")
            .trim();

          return {
            id: subject,
            name:
              typeof profile.name === "string"
                ? profile.name
                : fullName || null,
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
  session: { strategy: "database" },
  pages: { signIn: "/ingresar" },
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  callbacks: {
    async signIn({ user, account, profile }) {
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

      const localUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { university: true },
      });

      return Boolean(
        localUser &&
          localUser.universityId === currentUniversity.id &&
          !localUser.isDemo &&
          localUser.status === "ACTIVE" &&
          localUser.role === "STUDENT" &&
          localUser.university.status === "ACTIVE" &&
          !localUser.university.isDemo,
      );
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
