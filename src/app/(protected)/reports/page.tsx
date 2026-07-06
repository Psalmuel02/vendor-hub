import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import {
  getAveragePerformanceByPeriod,
  getComplianceScoreDistribution,
  getExpiringOrExpiredDocuments,
  getVendorStatusBreakdown,
} from "@/lib/reports-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DocumentStatusBadge } from "@/components/document-status-badge"
import { PerformanceChart } from "@/components/performance/performance-chart"
import { VendorStatusChart } from "@/components/reports/vendor-status-chart"
import { ScoreDistributionChart } from "@/components/reports/score-distribution-chart"

export default async function ReportsPage() {
  const session = await auth()
  if (session?.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [statusBreakdown, scoreDistribution, performanceTrend, expiringDocuments] =
    await Promise.all([
      getVendorStatusBreakdown(),
      getComplianceScoreDistribution(),
      getAveragePerformanceByPeriod(),
      getExpiringOrExpiredDocuments(),
    ])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Vendor Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vendors yet.</p>
          ) : (
            <VendorStatusChart data={statusBreakdown} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Compliance Score Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreDistributionChart data={scoreDistribution} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Performance Trend (all vendors, avg)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {performanceTrend.length === 0 ? (
            <p className="text-sm text-muted-foreground">No performance reviews yet.</p>
          ) : (
            <PerformanceChart
              data={performanceTrend.map((t) => ({
                period: t.period,
                overallScore: t.averageScore,
              }))}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Documents Expiring or Expired
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expiringDocuments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing expiring soon.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.vendor.companyName}</TableCell>
                    <TableCell>{doc.type}</TableCell>
                    <TableCell>
                      <DocumentStatusBadge status={doc.effectiveStatus} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.expiryDate?.toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
