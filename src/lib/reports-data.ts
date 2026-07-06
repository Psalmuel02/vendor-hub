import { prisma } from "@/lib/prisma"
import { getEffectiveDocumentStatus } from "@/lib/document-status"

export async function getExpiringOrExpiredDocuments() {
  const documents = await prisma.complianceDocument.findMany({
    where: { status: "APPROVED", expiryDate: { not: null } },
    include: { vendor: { select: { id: true, companyName: true } } },
    orderBy: { expiryDate: "asc" },
  })

  return documents
    .map((doc) => ({ ...doc, effectiveStatus: getEffectiveDocumentStatus(doc) }))
    .filter((doc) => doc.effectiveStatus === "EXPIRING_SOON" || doc.effectiveStatus === "EXPIRED")
}

export async function getAveragePerformanceByPeriod() {
  const reviews = await prisma.performanceReview.findMany({
    select: { period: true, overallScore: true },
    orderBy: { period: "asc" },
  })

  const byPeriod = new Map<string, { sum: number; count: number }>()
  for (const review of reviews) {
    const entry = byPeriod.get(review.period) ?? { sum: 0, count: 0 }
    entry.sum += review.overallScore
    entry.count += 1
    byPeriod.set(review.period, entry)
  }

  return Array.from(byPeriod.entries())
    .map(([period, { sum, count }]) => ({ period, averageScore: sum / count }))
    .sort((a, b) => a.period.localeCompare(b.period))
}

const SCORE_BUCKETS = [
  { label: "0–20", min: 0, max: 20 },
  { label: "21–40", min: 21, max: 40 },
  { label: "41–60", min: 41, max: 60 },
  { label: "61–80", min: 61, max: 80 },
  { label: "81–100", min: 81, max: 100 },
] as const

export async function getComplianceScoreDistribution() {
  const vendors = await prisma.vendor.findMany({
    where: { complianceScore: { not: null } },
    select: { complianceScore: true },
  })

  return SCORE_BUCKETS.map((bucket) => ({
    bucket: bucket.label,
    count: vendors.filter(
      (v) => v.complianceScore! >= bucket.min && v.complianceScore! <= bucket.max
    ).length,
  }))
}

export async function getVendorStatusBreakdown() {
  const vendors = await prisma.vendor.groupBy({
    by: ["status"],
    _count: { status: true },
  })

  return vendors.map((v) => ({ status: v.status, count: v._count.status }))
}
