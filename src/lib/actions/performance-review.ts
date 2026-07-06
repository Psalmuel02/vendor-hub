"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const reviewSchema = z.object({
  vendorId: z.string().min(1, "Please select a vendor"),
  period: z.string().min(1, "Period is required"),
  comment: z.string().optional(),
})

export type PerformanceReviewState = { error: string } | undefined

export async function submitPerformanceReview(
  _prevState: PerformanceReviewState,
  formData: FormData
): Promise<PerformanceReviewState> {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "APPROVER")) {
    throw new Error("Only Admins and Approvers can submit performance reviews")
  }

  const parsed = reviewSchema.safeParse({
    vendorId: formData.get("vendorId"),
    period: formData.get("period"),
    comment: formData.get("comment") || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: parsed.data.vendorId } })
  if (!vendor) {
    return { error: "Vendor not found" }
  }

  const kpis = await prisma.kpiTemplate.findMany()
  if (kpis.length === 0) {
    return { error: "No KPI templates have been configured yet" }
  }

  const scores = kpis.map((kpi) => {
    const raw = formData.get(`score-${kpi.id}`)
    const value = raw != null ? Number(raw) : 0
    return { kpiId: kpi.id, score: Math.min(Math.max(value, 0), 100) }
  })

  const totalWeight = kpis.reduce((sum, kpi) => sum + kpi.weight, 0)
  const overallScore =
    totalWeight > 0
      ? scores.reduce((sum, s) => {
          const kpi = kpis.find((k) => k.id === s.kpiId)
          return sum + s.score * (kpi?.weight ?? 0)
        }, 0) / totalWeight
      : 0

  await prisma.$transaction(async (tx) => {
    const review = await tx.performanceReview.create({
      data: {
        vendorId: vendor.id,
        period: parsed.data.period,
        scores,
        overallScore,
        reviewedById: session.user.id,
        comment: parsed.data.comment,
      },
    })

    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "PERFORMANCE_REVIEW_SUBMITTED",
        targetType: "PerformanceReview",
        targetId: review.id,
        metadata: { vendorId: vendor.id, period: parsed.data.period, overallScore },
      },
    })
  })

  redirect(`/vendors/${vendor.id}`)
}
