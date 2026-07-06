import { prisma } from "@/lib/prisma"
import { StatTile } from "@/components/stat-tile"
import { DocumentStatusBadge } from "@/components/document-status-badge"
import { getEffectiveDocumentStatus } from "@/lib/document-status"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export async function VendorDashboard({ vendorId }: { vendorId: string }) {
  const [vendor, documents, latestReview] = await Promise.all([
    prisma.vendor.findUnique({ where: { id: vendorId } }),
    prisma.complianceDocument.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.performanceReview.findFirst({ where: { vendorId }, orderBy: { createdAt: "desc" } }),
  ])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vendor?.complianceScore != null ? (
              <div className="space-y-2">
                <p className="text-2xl font-semibold">{Math.round(vendor.complianceScore)}%</p>
                <Progress value={vendor.complianceScore} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not yet assessed</p>
            )}
          </CardContent>
        </Card>

        <StatTile
          label="Latest Performance Score"
          value={latestReview ? `${latestReview.overallScore.toFixed(1)}%` : "—"}
          hint={latestReview?.period}
        />

        <StatTile label="Vendor Status" value={vendor?.status ?? "—"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            My Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between text-sm">
                <span>{doc.type}</span>
                <DocumentStatusBadge status={getEffectiveDocumentStatus(doc)} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
