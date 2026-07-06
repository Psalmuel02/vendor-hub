"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  if (session?.user.role !== "ADMIN") {
    throw new Error("Only Admins can manage vendor categories")
  }
}

const nameSchema = z.object({ name: z.string().min(1, "Name is required") })

export type CategoryState = { error: string } | undefined

export async function createCategory(
  _prevState: CategoryState,
  formData: FormData
): Promise<CategoryState> {
  await requireAdmin()

  const parsed = nameSchema.safeParse({ name: formData.get("name") })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const existing = await prisma.vendorCategory.findUnique({ where: { name: parsed.data.name } })
  if (existing) {
    return { error: "A category with this name already exists" }
  }

  await prisma.vendorCategory.create({ data: { name: parsed.data.name } })
  revalidatePath("/settings/categories")
}

export type DeleteCategoryState = { error: string } | undefined

export async function deleteCategory(
  _prevState: DeleteCategoryState,
  formData: FormData
): Promise<DeleteCategoryState> {
  await requireAdmin()

  const categoryId = formData.get("categoryId")
  if (typeof categoryId !== "string") {
    return { error: "Invalid request" }
  }

  const vendorCount = await prisma.vendor.count({ where: { categoryId } })
  if (vendorCount > 0) {
    return { error: `Cannot delete — ${vendorCount} vendor(s) still use this category` }
  }

  await prisma.vendorCategory.delete({ where: { id: categoryId } })
  revalidatePath("/settings/categories")
}
