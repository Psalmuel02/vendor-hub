"use client"

import { useRouter } from "next/navigation"

import { Progress } from "@/components/ui/progress"
import { TableCell, TableRow } from "@/components/ui/table"
import { VendorStatusBadge } from "@/components/vendor-status-badge"
import type { VendorStatus } from "@/generated/prisma/client"

export type VendorRow = {
  id: string
  companyName: string
  categoryName: string
  status: VendorStatus
  complianceScore: number | null
  performanceScore: number | null
  createdAt: Date
}

export function VendorTableRow({ vendor }: { vendor: VendorRow }) {
  const router = useRouter()

  return (
    <TableRow
      className="cursor-pointer"
      onClick={() => router.push(`/vendors/${vendor.id}`)}
    >
      <TableCell className="font-medium">{vendor.companyName}</TableCell>
      <TableCell>{vendor.categoryName}</TableCell>
      <TableCell>
        <VendorStatusBadge status={vendor.status} />
      </TableCell>
      <TableCell>
        {vendor.complianceScore != null ? (
          <div className="flex w-32 items-center gap-2">
            <Progress value={vendor.complianceScore} className="w-20" />
            <span className="text-xs text-muted-foreground">
              {Math.round(vendor.complianceScore)}%
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Not assessed</span>
        )}
      </TableCell>
      <TableCell>
        {vendor.performanceScore != null ? (
          <div className="flex w-32 items-center gap-2">
            <Progress value={vendor.performanceScore} className="w-20" />
            <span className="text-xs text-muted-foreground">
              {Math.round(vendor.performanceScore)}%
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No reviews yet</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {vendor.createdAt.toLocaleDateString()}
      </TableCell>
    </TableRow>
  )
}
