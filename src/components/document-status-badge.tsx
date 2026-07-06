import { Badge } from "@/components/ui/badge"
import type { EffectiveDocumentStatus } from "@/lib/document-status"
import { cn } from "@/lib/utils"

const LABELS: Record<EffectiveDocumentStatus, string> = {
  PENDING_REVIEW: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  EXPIRING_SOON: "Expiring Soon",
}

const STYLES: Record<EffectiveDocumentStatus, string> = {
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  PENDING_REVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  EXPIRING_SOON: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-400",
  REJECTED: "",
  EXPIRED: "",
}

export function DocumentStatusBadge({ status }: { status: EffectiveDocumentStatus }) {
  if (status === "REJECTED" || status === "EXPIRED") {
    return <Badge variant="destructive">{LABELS[status]}</Badge>
  }

  return <Badge className={cn(STYLES[status])}>{LABELS[status]}</Badge>
}
