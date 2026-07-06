"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useRef, useState } from "react"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const STATUS_OPTIONS = ["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"] as const

export function VendorFilters({
  categories,
}: {
  categories: { id: string; name: string }[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "")

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/vendors?${params.toString()}`)
  }

  function onSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateParam("q", value), 300)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search company name..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-64"
      />
      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(value) => updateParam("status", value as string)}
      >
        <SelectTrigger className="w-40">
          <SelectValue>
            {(value: string) =>
              value === "all" ? "All statuses" : value
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("category") ?? "all"}
        onValueChange={(value) => updateParam("category", value as string)}
      >
        <SelectTrigger className="w-48">
          <SelectValue>
            {(value: string) =>
              value === "all"
                ? "All categories"
                : (categories.find((c) => c.id === value)?.name ?? "All categories")
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
