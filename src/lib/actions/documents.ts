"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { recomputeVendorComplianceScore } from "@/lib/compliance-score"
import { ApprovalStatus, DocumentStatus } from "@/generated/prisma/client"

const reviewSchema = z.object({
  documentId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().optional(),
})

export type ReviewDocumentState = { error: string } | undefined

export async function reviewDocument(
  _prevState: ReviewDocumentState,
  formData: FormData
): Promise<ReviewDocumentState> {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "APPROVER")) {
    throw new Error("Only Admins and Approvers can review documents")
  }

  const parsed = reviewSchema.safeParse({
    documentId: formData.get("documentId"),
    decision: formData.get("decision"),
    comment: formData.get("comment") || undefined,
  })
  if (!parsed.success) {
    return { error: "Invalid request" }
  }

  if (parsed.data.decision === "REJECTED" && !parsed.data.comment?.trim()) {
    return { error: "A comment is required when rejecting a document" }
  }

  const document = await prisma.complianceDocument.findUnique({
    where: { id: parsed.data.documentId },
  })
  if (!document) {
    return { error: "Document not found" }
  }

  const nextStatus =
    parsed.data.decision === "APPROVED" ? DocumentStatus.APPROVED : DocumentStatus.REJECTED

  await prisma.$transaction(async (tx) => {
    await tx.complianceDocument.update({
      where: { id: document.id },
      data: {
        status: nextStatus,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        comment: parsed.data.comment,
      },
    })

    await tx.approvalRequest.updateMany({
      where: { type: "DOCUMENT", refId: document.id, status: "PENDING" },
      data: {
        status: nextStatus === "APPROVED" ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        decidedById: session.user.id,
        comment: parsed.data.comment,
        decidedAt: new Date(),
      },
    })

    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: nextStatus === "APPROVED" ? "DOCUMENT_APPROVED" : "DOCUMENT_REJECTED",
        targetType: "ComplianceDocument",
        targetId: document.id,
        metadata: { comment: parsed.data.comment ?? null, vendorId: document.vendorId },
      },
    })
  })

  await recomputeVendorComplianceScore(document.vendorId)

  revalidatePath(`/vendors/${document.vendorId}`)
  revalidatePath("/compliance/documents")
  revalidatePath("/approvals")
}
