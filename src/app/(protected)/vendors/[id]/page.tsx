import { notFound } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VendorStatusBadge } from "@/components/vendor-status-badge"
import { ComingSoon } from "@/components/coming-soon"
import { DocumentsTable } from "@/components/documents-table"
import { ChecklistSection } from "@/components/checklist/checklist-section"
import { PerformanceHistory } from "@/components/performance/performance-history"
import { SetBreadcrumbLabel } from "@/components/layout/breadcrumb-context"

import { toggleVendorStatus } from "./actions"

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [session, vendor] = await Promise.all([
    auth(),
    prisma.vendor.findUnique({
      where: { id },
      include: {
        user: true,
        category: true,
        performanceReviews: { orderBy: { createdAt: "desc" }, take: 1 },
        approvalRequests: { where: { status: "PENDING" } },
        documents: { orderBy: { createdAt: "desc" } },
      },
    }),
  ])

  if (!vendor) notFound()

  const isAdmin = session?.user.role === "ADMIN"
  const canReviewDocuments = session?.user.role === "ADMIN" || session?.user.role === "APPROVER"
  const performanceScore = vendor.performanceReviews[0]?.overallScore ?? null
  const openApprovals = vendor.approvalRequests.length
  const canToggleStatus = vendor.status === "ACTIVE" || vendor.status === "SUSPENDED"
  const nextStatus = vendor.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"

  return (
    <div className="space-y-4">
      <SetBreadcrumbLabel path={`/vendors/${vendor.id}`} label={vendor.companyName} />
      <Card>
        <CardContent className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{vendor.companyName}</h1>
              <VendorStatusBadge status={vendor.status} />
            </div>
            <p className="text-sm text-muted-foreground">{vendor.category.name}</p>
            <p className="text-sm text-muted-foreground">
              Contact: {vendor.user.name} ({vendor.user.email})
            </p>
            {vendor.phone && (
              <p className="text-sm text-muted-foreground">Phone: {vendor.phone}</p>
            )}
            {vendor.address && (
              <p className="text-sm text-muted-foreground">Address: {vendor.address}</p>
            )}
          </div>
          {isAdmin && canToggleStatus && (
            <form action={toggleVendorStatus}>
              <input type="hidden" name="vendorId" value={vendor.id} />
              <input type="hidden" name="nextStatus" value={nextStatus} />
              <Button
                type="submit"
                variant={vendor.status === "ACTIVE" ? "destructive" : "default"}
              >
                {vendor.status === "ACTIVE" ? "Suspend" : "Activate"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Compliance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vendor.complianceScore != null ? (
                <div className="space-y-2">
                  <p className="text-2xl font-semibold">
                    {Math.round(vendor.complianceScore)}%
                  </p>
                  <Progress value={vendor.complianceScore} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not yet assessed</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Performance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performanceScore != null ? (
                <div className="space-y-2">
                  <p className="text-2xl font-semibold">{Math.round(performanceScore)}%</p>
                  <Progress value={performanceScore} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No reviews yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{openApprovals}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent>
              <DocumentsTable documents={vendor.documents} canReview={canReviewDocuments} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="checklist">
          <ChecklistSection vendorId={vendor.id} viewerRole="STAFF" />
        </TabsContent>
        <TabsContent value="performance">
          <PerformanceHistory vendorId={vendor.id} />
        </TabsContent>
        <TabsContent value="history">
          <ComingSoon title="History" phase="Phase 10" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
