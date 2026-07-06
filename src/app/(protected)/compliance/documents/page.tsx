import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { DocumentsTable } from "@/components/documents-table"
import { getEffectiveDocumentStatus } from "@/lib/document-status"

import { DocumentFilters } from "./document-filters"

export default async function ComplianceDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const [{ status }, session, documents] = await Promise.all([
    searchParams,
    auth(),
    prisma.complianceDocument.findMany({
      include: { vendor: { select: { id: true, companyName: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const filtered = status
    ? documents.filter((doc) => getEffectiveDocumentStatus(doc) === status)
    : documents

  const canReview = session?.user.role === "ADMIN" || session?.user.role === "APPROVER"

  return (
    <div className="space-y-4">
      <DocumentFilters />
      <Card>
        <CardContent>
          <DocumentsTable documents={filtered} canReview={canReview} />
        </CardContent>
      </Card>
    </div>
  )
}
