import { prisma } from "@/lib/prisma"
import { getActiveChecklistTemplate } from "@/lib/checklist"

/**
 * PRD 4.2: compliance status is "a function of (all required docs approved
 * + non-expired) + (checklist score >= threshold)". With no stated weights,
 * this averages the two components and only counts ones that have data yet.
 */
export async function recomputeVendorComplianceScore(vendorId: string) {
  const [documents, latestScoredResponse, template] = await Promise.all([
    prisma.complianceDocument.findMany({ where: { vendorId }, select: { status: true } }),
    prisma.checklistResponse.findFirst({
      where: { vendorId, status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { submittedAt: "desc" },
    }),
    getActiveChecklistTemplate(),
  ])

  const documentComponent =
    documents.length > 0
      ? (documents.filter((d) => d.status === "APPROVED").length / documents.length) * 100
      : null

  let checklistComponent: number | null = null
  if (latestScoredResponse?.totalScore != null && template) {
    const maxWeight = template.items.reduce((sum, item) => sum + item.weight, 0)
    checklistComponent = maxWeight > 0 ? (latestScoredResponse.totalScore / maxWeight) * 100 : null
  }

  const components = [documentComponent, checklistComponent].filter(
    (c): c is number => c != null
  )
  const complianceScore =
    components.length > 0 ? components.reduce((a, b) => a + b, 0) / components.length : null

  await prisma.vendor.update({ where: { id: vendorId }, data: { complianceScore } })
}
