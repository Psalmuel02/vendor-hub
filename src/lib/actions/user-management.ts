"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Role } from "@/generated/prisma/client"

const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "APPROVER", "VENDOR"]),
})

export type UpdateUserRoleState = { error: string } | undefined

export async function updateUserRole(
  _prevState: UpdateUserRoleState,
  formData: FormData
): Promise<UpdateUserRoleState> {
  const session = await auth()
  if (session?.user.role !== "ADMIN") {
    throw new Error("Only Admins can manage user roles")
  }

  const parsed = roleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  })
  if (!parsed.success) {
    return { error: "Invalid request" }
  }

  if (parsed.data.userId === session.user.id) {
    return { error: "You cannot change your own role" }
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role as Role },
  })

  revalidatePath("/settings/users")
}
