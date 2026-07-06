"use client"

import { useRouter, useSearchParams } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AuditLogFilters({ actions }: { actions: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateAction(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set("action", value)
    } else {
      params.delete("action")
    }
    router.push(`/audit-log?${params.toString()}`)
  }

  return (
    <Select value={searchParams.get("action") ?? "all"} onValueChange={(value) => updateAction(value as string)}>
      <SelectTrigger className="w-64">
        <SelectValue>
          {(value: string) => (value === "all" ? "All actions" : value)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All actions</SelectItem>
        {actions.map((action) => (
          <SelectItem key={action} value={action}>
            {action}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
