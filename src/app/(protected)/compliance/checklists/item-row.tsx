"use client"

import { useActionState, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TableCell, TableRow } from "@/components/ui/table"
import {
  deleteChecklistItem,
  updateChecklistItem,
  type ChecklistItemState,
} from "@/lib/actions/checklist-template"

export function ItemRow({ item }: { item: { id: string; label: string; weight: number } }) {
  const [editing, setEditing] = useState(false)
  const [state, formAction, isPending] = useActionState<ChecklistItemState, FormData>(
    updateChecklistItem,
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
            <input type="hidden" name="itemId" value={item.id} />
            <Input name="label" defaultValue={item.label} className="max-w-xs" />
            <Input name="weight" type="number" min={1} max={100} defaultValue={item.weight} className="w-20" />
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
      <TableCell className="font-medium">{item.label}</TableCell>
      <TableCell>{item.weight}</TableCell>
      <TableCell className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <form action={deleteChecklistItem}>
          <input type="hidden" name="itemId" value={item.id} />
          <Button type="submit" size="sm" variant="destructive">
            Delete
          </Button>
        </form>
      </TableCell>
    </TableRow>
  )
}
