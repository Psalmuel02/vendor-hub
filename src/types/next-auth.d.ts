import type { DefaultSession } from "next-auth"
import type { Role } from "@/generated/prisma/client"

declare module "next-auth" {
  interface User {
    role: Role
    vendorId: string | null
  }

  interface Session {
    user: {
      id: string
      role: Role
      vendorId: string | null
    } & DefaultSession["user"]
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: Role
    vendorId: string | null
  }
}
