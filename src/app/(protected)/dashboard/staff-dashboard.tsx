import Link from "next/link"

import { prisma } from "@/lib/prisma"
import { getAveragePerformanceByPeriod } from "@/lib/reports-data"
import { getEffectiveDocumentStatus } from "@/lib/document-status"
import { StatTile } from "@/components/stat-tile"
import { PerformanceChart } from "@/components/performance/performance-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export async function StaffDashboard() {
  const [vendorCount, pendingApprovals, vendors, documents, trend] = await Promise.all([
    prisma.vendor.count(),
    prisma.approvalRequest.findMany({
      where: { status: "PENDING" },
      include: { vendor: { select: { companyName: true } } },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.vendor.findMany({ select: { complianceScore: true } }),
    prisma.complianceDocument.findMany({
      where: { status: "APPROVED", expiryDate: { not: null } },
    }),
    getAveragePerformanceByPeriod(),
  ])

  const scored = vendors.filter((v) => v.complianceScore != null)
  const avgCompliance =
    scored.length > 0
      ? scored.reduce((sum, v) => sum + (v.complianceScore ?? 0), 0) / scored.length
      : null

  const expiringSoonCount = documents.filter(
    (doc) => getEffectiveDocumentStatus(doc) === "EXPIRING_SOON"
  ).length

  const totalPending = await prisma.approvalRequest.count({ where: { status: "PENDING" } })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total Vendors" value={String(vendorCount)} />
        <StatTile label="Pending Approvals" value={String(totalPending)} />
        <StatTile
          label="Avg Compliance Score"
          value={avgCompliance != null ? `${Math.round(avgCompliance)}%` : "—"}
        />
        <StatTile label="Documents Expiring Soon" value={String(expiringSoonCount)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent Approvals Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingApprovals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing pending.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.vendor.companyName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{request.type}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Link href="/approvals" className="mt-3 inline-block text-sm underline">
              View all approvals
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Performance Trend (all vendors, avg)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <p className="text-sm text-muted-foreground">No performance reviews yet.</p>
            ) : (
              <PerformanceChart
                data={trend.map((t) => ({ period: t.period, overallScore: t.averageScore }))}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
