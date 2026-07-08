import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const user = await prisma.user.findUnique({
          where: { email },
          include: { vendor: true },
        })
        if (!user) return null

        const passwordValid = await bcrypt.compare(password, user.password)
        if (!passwordValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          vendorId: user.vendor?.id ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.vendorId = user.vendorId
      }

      // The Vendor row is created later, during onboarding — not at sign-in
      // time — so a still-null vendorId is re-checked until it resolves.
      if (token.role === "VENDOR" && !token.vendorId && token.sub) {
        const vendor = await prisma.vendor.findUnique({ where: { userId: token.sub } })
        if (vendor) token.vendorId = vendor.id
      }

      return token
    },
    session({ session, token }) {
      session.user.id = token.sub as string
      session.user.role = token.role
      session.user.vendorId = token.vendorId
      return session
    },
  },
})
