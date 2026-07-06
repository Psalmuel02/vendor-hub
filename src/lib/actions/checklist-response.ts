"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveChecklistTemplate, type ChecklistAnswer } from "@/lib/checklist"
import { recomputeVendorComplianceScore } from "@/lib/compliance-score"
import { ApprovalStatus, ApprovalType } from "@/generated/prisma/client"

export type ChecklistActionState = { error: string } | undefined

export async function submitChecklistResponse(
  _prevState: ChecklistActionState,
  formData: FormData
): Promise<ChecklistActionState> {
  const session = await auth()
  if (!session || session.user.role !== "VENDOR" || !session.user.vendorId) {
    throw new Error("Only onboarded vendors can fill out the compliance checklist")
  }

  const template = await getActiveChecklistTemplate()
  if (!template) {
    return { error: "No checklist template has been configured yet" }
  }

  const vendorId = session.user.vendorId

  const existing = await prisma.checklistResponse.findFirst({
    where: { vendorId, templateId: template.id },
    orderBy: { submittedAt: "desc" },
  })
  if (existing && existing.status !== "REJECTED") {
    return { error: "You have already submitted this checklist" }
  }

  const answers: ChecklistAnswer[] = template.items.map((item) => {
    const answer = formData.get(`answer-${item.id}`)
    const note = formData.get(`note-${item.id}`)
    return {
      itemId: item.id,
      answer: answer === "YES" ? "YES" : "NO",
      note: typeof note === "string" && note.trim() ? note.trim() : undefined,
    }
  })

  if (existing) {
    await prisma.checklistResponse.update({
      where: { id: existing.id },
      data: {
        answers,
        status: ApprovalStatus.PENDING,
        totalScore: null,
        scoredById: null,
        submittedAt: new Date(),
      },
    })

    await prisma.approvalRequest.updateMany({
      where: { type: "CHECKLIST", refId: existing.id },
      data: { status: ApprovalStatus.PENDING, decidedById: null, decidedAt: null, comment: null },
    })
  } else {
    const response = await prisma.checklistResponse.create({
      data: {
        vendorId,
        templateId: template.id,
        answers,
        status: ApprovalStatus.PENDING,
      },
    })

    await prisma.approvalRequest.create({
      data: {
        vendorId,
        type: ApprovalType.CHECKLIST,
        refId: response.id,
        status: ApprovalStatus.PENDING,
      },
    })
  }

  revalidatePath("/my-profile")
  revalidatePath(`/vendors/${vendorId}`)
  revalidatePath("/approvals")
}

const scoreSchema = z.object({
  responseId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().optional(),
})

export async function scoreChecklistResponse(
  _prevState: ChecklistActionState,
  formData: FormData
): Promise<ChecklistActionState> {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "APPROVER")) {
    throw new Error("Only Admins and Approvers can score the compliance checklist")
  }

  const parsed = scoreSchema.safeParse({
    responseId: formData.get("responseId"),
    decision: formData.get("decision"),
    comment: formData.get("comment") || undefined,
  })
  if (!parsed.success) {
    return { error: "Invalid request" }
  }

  if (parsed.data.decision === "REJECTED" && !parsed.data.comment?.trim()) {
    return { error: "A comment is required when sending the checklist back" }
  }

  const response = await prisma.checklistResponse.findUnique({
    where: { id: parsed.data.responseId },
  })
  if (!response) {
    return { error: "Checklist response not found" }
  }

  const template = await getActiveChecklistTemplate()
  if (!template) {
    return { error: "Checklist template no longer exists" }
  }

  const answers = response.answers as unknown as ChecklistAnswer[]
  let totalScore: number | null = null

  const updatedAnswers: ChecklistAnswer[] = answers.map((answer) => {
    if (parsed.data.decision !== "APPROVED") return answer
    const item = template.items.find((i) => i.id === answer.itemId)
    if (!item) return answer
    const raw = formData.get(`score-${item.id}`)
    const scoreValue = raw != null ? Number(raw) : 0
    const clamped = Math.min(Math.max(scoreValue, 0), item.weight)
    return { ...answer, score: clamped }
  })

  if (parsed.data.decision === "APPROVED") {
    totalScore = updatedAnswers.reduce((sum, answer) => sum + (answer.score ?? 0), 0)
  }

  await prisma.$transaction(async (tx) => {
    await tx.checklistResponse.update({
      where: { id: response.id },
      data: {
        status: parsed.data.decision,
        totalScore,
        scoredById: session.user.id,
        answers: updatedAnswers,
      },
    })

    await tx.approvalRequest.updateMany({
      where: { type: "CHECKLIST", refId: response.id, status: "PENDING" },
      data: {
        status: parsed.data.decision,
        decidedById: session.user.id,
        comment: parsed.data.comment,
        decidedAt: new Date(),
      },
    })

    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: parsed.data.decision === "APPROVED" ? "CHECKLIST_APPROVED" : "CHECKLIST_REJECTED",
        targetType: "ChecklistResponse",
        targetId: response.id,
        metadata: { comment: parsed.data.comment ?? null, vendorId: response.vendorId },
      },
    })
  })

  await recomputeVendorComplianceScore(response.vendorId)

  revalidatePath("/my-profile")
  revalidatePath(`/vendors/${response.vendorId}`)
  revalidatePath("/approvals")
}
