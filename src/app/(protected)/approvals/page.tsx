import { prisma } from "@/lib/prisma"
import { getActiveChecklistTemplate, type ChecklistAnswer } from "@/lib/checklist"

import { ApprovalsQueue, type ApprovalItem } from "./approvals-queue"

export default async function ApprovalsPage() {
  const requests = await prisma.approvalRequest.findMany({
    where: { status: "PENDING" },
    include: { vendor: { select: { id: true, companyName: true } } },
    orderBy: { createdAt: "asc" },
  })

  const documentRefIds = requests.filter((r) => r.type === "DOCUMENT").map((r) => r.refId)
  const checklistRefIds = requests.filter((r) => r.type === "CHECKLIST").map((r) => r.refId)

  const [documents, checklistResponses, template] = await Promise.all([
    documentRefIds.length > 0
      ? prisma.complianceDocument.findMany({ where: { id: { in: documentRefIds } } })
      : Promise.resolve([]),
    checklistRefIds.length > 0
      ? prisma.checklistResponse.findMany({ where: { id: { in: checklistRefIds } } })
      : Promise.resolve([]),
    getActiveChecklistTemplate(),
  ])

  const items: ApprovalItem[] = requests
    .map((request): ApprovalItem | null => {
      const base = {
        id: request.id,
        createdAt: request.createdAt,
        vendor: request.vendor,
      }

      if (request.type === "ONBOARDING") {
        return { ...base, type: "ONBOARDING" }
      }

      if (request.type === "DOCUMENT") {
        const document = documents.find((d) => d.id === request.refId)
        if (!document) return null
        return { ...base, type: "DOCUMENT", document: { id: document.id, type: document.type } }
      }

      if (request.type === "CHECKLIST") {
        const response = checklistResponses.find((r) => r.id === request.refId)
        if (!response || !template) return null
        return {
          ...base,
          type: "CHECKLIST",
          response: {
            id: response.id,
            answers: response.answers as unknown as ChecklistAnswer[],
          },
          items: template.items,
        }
      }

      return null
    })
    .filter((item): item is ApprovalItem => item != null)

  return <ApprovalsQueue items={items} />
}
