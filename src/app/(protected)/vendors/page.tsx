import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { VendorStatus } from "@/generated/prisma/client"

import { VendorFilters } from "./vendor-filters"
import { VendorTableRow } from "./vendor-table-row"

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>
}) {
  const [{ q, status, category }, session, categories] = await Promise.all([
    searchParams,
    auth(),
    prisma.vendorCategory.findMany({ orderBy: { name: "asc" } }),
  ])

  const vendors = await prisma.vendor.findMany({
    where: {
      ...(status ? { status: status as VendorStatus } : {}),
      ...(category ? { categoryId: category } : {}),
      ...(q ? { companyName: { contains: q, mode: "insensitive" } } : {}),
    },
    include: {
      category: true,
      performanceReviews: { orderBy: { createdAt: "desc" }, take: 1 },
      approvalRequests: { where: { status: "PENDING" }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const isAdmin = session?.user.role === "ADMIN"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <VendorFilters categories={categories} />
        </div>
        {isAdmin && (
          <Button disabled title="Vendors self-register via the onboarding flow">
            Add Vendor
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.length === 0 && (
                <TableRow>
                  <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                    No vendors match these filters.
                  </td>
                </TableRow>
              )}
              {vendors.map((vendor) => (
                <VendorTableRow
                  key={vendor.id}
                  vendor={{
                    id: vendor.id,
                    companyName: vendor.companyName,
                    categoryName: vendor.category.name,
                    status: vendor.status,
                    complianceScore: vendor.complianceScore,
                    performanceScore: vendor.performanceReviews[0]?.overallScore ?? null,
                    createdAt: vendor.createdAt,
                  }}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
