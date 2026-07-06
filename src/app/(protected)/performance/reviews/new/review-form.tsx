"use client"

import { useActionState, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  submitPerformanceReview,
  type PerformanceReviewState,
} from "@/lib/actions/performance-review"

type Vendor = { id: string; companyName: string }
type Kpi = { id: string; name: string; weight: number }

export function ReviewForm({ vendors, kpis }: { vendors: Vendor[]; kpis: Kpi[] }) {
  const [state, formAction, isPending] = useActionState<PerformanceReviewState, FormData>(
    submitPerformanceReview,
    undefined
  )
  const [vendorId, setVendorId] = useState("")
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(kpis.map((kpi) => [kpi.id, 0]))
  )

  const totalWeight = kpis.reduce((sum, kpi) => sum + kpi.weight, 0)
  const overallScore = useMemo(() => {
    if (totalWeight === 0) return 0
    const weightedSum = kpis.reduce((sum, kpi) => sum + (scores[kpi.id] ?? 0) * kpi.weight, 0)
    return weightedSum / totalWeight
  }, [scores, kpis, totalWeight])

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Performance Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="vendorId">Vendor</FieldLabel>
              <input type="hidden" name="vendorId" value={vendorId} />
              <Select value={vendorId} onValueChange={(value) => setVendorId(value as string)}>
                <SelectTrigger id="vendorId" className="w-full">
                  <SelectValue>
                    {(value: string) =>
                      vendors.find((v) => v.id === value)?.companyName ?? "Select a vendor"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="period">Period</FieldLabel>
              <Input id="period" name="period" placeholder="e.g. 2026-Q3" />
            </Field>
          </div>

          <div className="space-y-3">
            {kpis.map((kpi) => (
              <div key={kpi.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">{kpi.name}</p>
                  <p className="text-sm text-muted-foreground">Weight {kpi.weight}</p>
                </div>
                <Input
                  name={`score-${kpi.id}`}
                  type="number"
                  min={0}
                  max={100}
                  value={scores[kpi.id]}
                  onChange={(e) =>
                    setScores((prev) => ({ ...prev, [kpi.id]: Number(e.target.value) }))
                  }
                  className="w-24"
                />
              </div>
            ))}
          </div>

          <Field>
            <FieldLabel htmlFor="comment">Comment (optional)</FieldLabel>
            <Textarea id="comment" name="comment" />
          </Field>

          <div className="flex items-center justify-between rounded-md bg-muted p-3">
            <span className="font-medium">Overall Score</span>
            <span className="text-xl font-semibold">{overallScore.toFixed(1)}%</span>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={isPending || !vendorId}>
            {isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
