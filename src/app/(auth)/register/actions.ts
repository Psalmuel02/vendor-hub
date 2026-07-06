"use server"

import bcrypt from "bcryptjs"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { signIn } from "@/lib/auth"
import { Role } from "@/generated/prisma/client"

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export type RegisterState = { error: string } | undefined

export async function registerVendor(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "An account with this email already exists" }
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name, email, password: hashed, role: Role.VENDOR },
  })

  await signIn("credentials", { email, password, redirectTo: "/onboarding" })
}
