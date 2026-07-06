"use client"

import { useRouter, useSearchParams } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const STATUS_OPTIONS = [
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "EXPIRING_SOON",
  "EXPIRED",
] as const

const LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  PENDING_REVIEW: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  EXPIRING_SOON: "Expiring Soon",
  EXPIRED: "Expired",
}

export function DocumentFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateStatus(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set("status", value)
    } else {
      params.delete("status")
    }
    router.push(`/compliance/documents?${params.toString()}`)
  }

  return (
    <Select value={searchParams.get("status") ?? "all"} onValueChange={(value) => updateStatus(value as string)}>
      <SelectTrigger className="w-48">
        <SelectValue>
          {(value: string) =>
            value === "all"
              ? "All statuses"
              : (LABELS[value as (typeof STATUS_OPTIONS)[number]] ?? value)
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        {STATUS_OPTIONS.map((status) => (
          <SelectItem key={status} value={status}>
            {LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
