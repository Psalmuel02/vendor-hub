import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DocumentStatusBadge } from "@/components/document-status-badge"
import { ReviewDocumentDialog } from "@/components/review-document-dialog"
import { getEffectiveDocumentStatus } from "@/lib/document-status"
import type { DocumentStatus } from "@/generated/prisma/client"

export type DocumentRow = {
  id: string
  type: string
  status: DocumentStatus
  expiryDate: Date | null
  createdAt: Date
  comment: string | null
  vendor?: { id: string; companyName: string }
}

export function DocumentsTable({
  documents,
  canReview,
}: {
  documents: DocumentRow[]
  canReview: boolean
}) {
  const showVendorColumn = documents.some((d) => d.vendor)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showVendorColumn && <TableHead>Vendor</TableHead>}
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Uploaded</TableHead>
          {canReview && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.length === 0 && (
          <TableRow>
            <td
              colSpan={showVendorColumn ? 6 : 5}
              className="p-6 text-center text-sm text-muted-foreground"
            >
              No documents yet.
            </td>
          </TableRow>
        )}
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            {showVendorColumn && (
              <TableCell>
                {doc.vendor ? (
                  <Link href={`/vendors/${doc.vendor.id}`} className="hover:underline">
                    {doc.vendor.companyName}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
            )}
            <TableCell className="font-medium">{doc.type}</TableCell>
            <TableCell>
              <DocumentStatusBadge status={getEffectiveDocumentStatus(doc)} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {doc.expiryDate ? doc.expiryDate.toLocaleDateString() : "No expiry set"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {doc.createdAt.toLocaleDateString()}
            </TableCell>
            {canReview && (
              <TableCell>
                {doc.status === "PENDING_REVIEW" ? (
                  <ReviewDocumentDialog documentId={doc.id} documentType={doc.type} />
                ) : (
                  doc.comment && (
                    <span className="text-xs text-muted-foreground">&quot;{doc.comment}&quot;</span>
                  )
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
