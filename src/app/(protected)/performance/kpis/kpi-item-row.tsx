"use client"

import { useActionState, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TableCell, TableRow } from "@/components/ui/table"
import {
  deleteKpiTemplate,
  updateKpiTemplate,
  type KpiTemplateState,
} from "@/lib/actions/kpi-template"

export function KpiItemRow({ kpi }: { kpi: { id: string; name: string; weight: number } }) {
  const [editing, setEditing] = useState(false)
  const [state, formAction, isPending] = useActionState<KpiTemplateState, FormData>(
    updateKpiTemplate,
    undefined
  )
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      setEditing(false)
    }
    wasPending.current = isPending
  }, [isPending, state])

  if (editing) {
    return (
      <TableRow>
        <TableCell colSpan={3}>
          <form action={formAction} className="flex items-center gap-2">
            <input type="hidden" name="kpiId" value={kpi.id} />
            <Input name="name" defaultValue={kpi.name} className="max-w-xs" />
            <Input
              name="weight"
              type="number"
              min={1}
              max={100}
              defaultValue={kpi.weight}
              className="w-20"
            />
            <Button type="submit" size="sm" disabled={isPending}>
              Save
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            {state?.error && <span className="text-sm text-destructive">{state.error}</span>}
          </form>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{kpi.name}</TableCell>
      <TableCell>{kpi.weight}</TableCell>
      <TableCell className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <form action={deleteKpiTemplate}>
          <input type="hidden" name="kpiId" value={kpi.id} />
          <Button type="submit" size="sm" variant="destructive">
            Delete
          </Button>
        </form>
      </TableCell>
    </TableRow>
  )
}
