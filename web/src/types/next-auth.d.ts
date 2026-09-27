import type { DefaultSession } from "next-auth";
import type { UserRole, UserStatus } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      universityId: string;
      role: UserRole;
      status: UserStatus;
    };
  }

  interface User {
    universityId: string;
    role: UserRole;
    status: UserStatus;
  }
}
