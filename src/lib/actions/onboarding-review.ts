"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApprovalStatus, VendorStatus } from "@/generated/prisma/client"

const reviewSchema = z.object({
  vendorId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().optional(),
})

export type ReviewOnboardingState = { error: string } | undefined

export async function reviewOnboarding(
  _prevState: ReviewOnboardingState,
  formData: FormData
): Promise<ReviewOnboardingState> {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "APPROVER")) {
    throw new Error("Only Admins and Approvers can review onboarding applications")
  }

  const parsed = reviewSchema.safeParse({
    vendorId: formData.get("vendorId"),
    decision: formData.get("decision"),
    comment: formData.get("comment") || undefined,
  })
  if (!parsed.success) {
    return { error: "Invalid request" }
  }

  if (parsed.data.decision === "REJECTED" && !parsed.data.comment?.trim()) {
    return { error: "A comment is required when rejecting an onboarding application" }
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: parsed.data.vendorId } })
  if (!vendor) {
    return { error: "Vendor not found" }
  }
  if (vendor.status !== "PENDING") {
    return { error: "This vendor is not pending onboarding review" }
  }

  const nextStatus =
    parsed.data.decision === "APPROVED" ? VendorStatus.ACTIVE : VendorStatus.REJECTED

  await prisma.$transaction(async (tx) => {
    await tx.vendor.update({ where: { id: vendor.id }, data: { status: nextStatus } })

    await tx.approvalRequest.updateMany({
      where: { type: "ONBOARDING", refId: vendor.id, status: "PENDING" },
      data: {
        status: parsed.data.decision === "APPROVED" ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        decidedById: session.user.id,
        comment: parsed.data.comment,
        decidedAt: new Date(),
      },
    })

    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: parsed.data.decision === "APPROVED" ? "ONBOARDING_APPROVED" : "ONBOARDING_REJECTED",
        targetType: "Vendor",
        targetId: vendor.id,
        metadata: { comment: parsed.data.comment ?? null },
      },
    })
  })

  revalidatePath(`/vendors/${vendor.id}`)
  revalidatePath("/vendors")
  revalidatePath("/approvals")
}
