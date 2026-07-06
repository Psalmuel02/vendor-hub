import { prisma } from "@/lib/prisma"

import { ReviewForm } from "./review-form"

export default async function NewPerformanceReviewPage() {
  const [vendors, kpis] = await Promise.all([
    prisma.vendor.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
    prisma.kpiTemplate.findMany({ orderBy: { weight: "desc" } }),
  ])

  return (
    <div className="mx-auto max-w-2xl">
      <ReviewForm vendors={vendors} kpis={kpis} />
    </div>
  )
}
