import { Badge } from "@/components/ui/badge"
import type { VendorStatus } from "@/generated/prisma/client"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<VendorStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  SUSPENDED: "",
  REJECTED: "",
}

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
  if (status === "SUSPENDED" || status === "REJECTED") {
    return <Badge variant="destructive">{status}</Badge>
  }

  return <Badge className={cn(STATUS_STYLES[status])}>{status}</Badge>
}
