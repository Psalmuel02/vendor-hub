"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  if (session?.user.role !== "ADMIN") {
    throw new Error("Only Admins can manage KPI templates")
  }
}

const kpiSchema = z.object({
  name: z.string().min(1, "Name is required"),
  weight: z.coerce.number().int().min(1).max(100),
})

export type KpiTemplateState = { error: string } | undefined

export async function addKpiTemplate(
  _prevState: KpiTemplateState,
  formData: FormData
): Promise<KpiTemplateState> {
  await requireAdmin()

  const parsed = kpiSchema.safeParse({
    name: formData.get("name"),
    weight: formData.get("weight"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  await prisma.kpiTemplate.create({ data: parsed.data })
  revalidatePath("/performance/kpis")
}

const updateKpiSchema = z.object({
  kpiId: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  weight: z.coerce.number().int().min(1).max(100),
})

export async function updateKpiTemplate(
  _prevState: KpiTemplateState,
  formData: FormData
): Promise<KpiTemplateState> {
  await requireAdmin()

  const parsed = updateKpiSchema.safeParse({
    kpiId: formData.get("kpiId"),
    name: formData.get("name"),
    weight: formData.get("weight"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  await prisma.kpiTemplate.update({
    where: { id: parsed.data.kpiId },
    data: { name: parsed.data.name, weight: parsed.data.weight },
  })
  revalidatePath("/performance/kpis")
}

export async function deleteKpiTemplate(formData: FormData) {
  await requireAdmin()

  const kpiId = formData.get("kpiId")
  if (typeof kpiId !== "string") return

  await prisma.kpiTemplate.delete({ where: { id: kpiId } })
  revalidatePath("/performance/kpis")
}
