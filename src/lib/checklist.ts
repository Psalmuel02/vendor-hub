import { prisma } from "@/lib/prisma"

export type ChecklistAnswer = {
  itemId: string
  answer: "YES" | "NO"
  note?: string
  score?: number
}

/**
 * MVP scope is a single global checklist template (not per-category), and
 * ChecklistResponse.templateId has no Prisma relation object in the PRD's
 * schema sketch — so callers resolve the template directly instead of
 * traversing a relation.
 */
export function getActiveChecklistTemplate() {
  return prisma.checklistTemplate.findFirst({
    include: { items: { orderBy: { weight: "desc" } } },
    orderBy: { createdAt: "asc" },
  })
}
