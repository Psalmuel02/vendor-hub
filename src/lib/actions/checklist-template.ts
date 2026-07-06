"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  if (session?.user.role !== "ADMIN") {
    throw new Error("Only Admins can manage checklist templates")
  }
}

export async function createChecklistTemplate() {
  await requireAdmin()

  const existing = await prisma.checklistTemplate.findFirst()
  if (!existing) {
    await prisma.checklistTemplate.create({
      data: { name: "Standard Vendor Onboarding Checklist" },
    })
  }

  revalidatePath("/compliance/checklists")
}

const itemSchema = z.object({
  templateId: z.string().min(1),
  label: z.string().min(1, "Label is required"),
  weight: z.coerce.number().int().min(1).max(100),
})

export type ChecklistItemState = { error: string } | undefined

export async function addChecklistItem(
  _prevState: ChecklistItemState,
  formData: FormData
): Promise<ChecklistItemState> {
  await requireAdmin()

  const parsed = itemSchema.safeParse({
    templateId: formData.get("templateId"),
    label: formData.get("label"),
    weight: formData.get("weight"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  await prisma.checklistItem.create({ data: parsed.data })
  revalidatePath("/compliance/checklists")
}

const updateItemSchema = z.object({
  itemId: z.string().min(1),
  label: z.string().min(1, "Label is required"),
  weight: z.coerce.number().int().min(1).max(100),
})

export async function updateChecklistItem(
  _prevState: ChecklistItemState,
  formData: FormData
): Promise<ChecklistItemState> {
  await requireAdmin()

  const parsed = updateItemSchema.safeParse({
    itemId: formData.get("itemId"),
    label: formData.get("label"),
    weight: formData.get("weight"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  await prisma.checklistItem.update({
    where: { id: parsed.data.itemId },
    data: { label: parsed.data.label, weight: parsed.data.weight },
  })
  revalidatePath("/compliance/checklists")
}

export async function deleteChecklistItem(formData: FormData) {
  await requireAdmin()

  const itemId = formData.get("itemId")
  if (typeof itemId !== "string") return

  await prisma.checklistItem.delete({ where: { id: itemId } })
  revalidatePath("/compliance/checklists")
}
