"use client"

import { useActionState, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addChecklistItem, type ChecklistItemState } from "@/lib/actions/checklist-template"

export function AddItemForm({ templateId }: { templateId: string }) {
  const [state, formAction, isPending] = useActionState<ChecklistItemState, FormData>(
    addChecklistItem,
    undefined
  )
  const formRef = useRef<HTMLFormElement>(null)
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      formRef.current?.reset()
    }
    wasPending.current = isPending
  }, [isPending, state])

  return (
    <form ref={formRef} action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="templateId" value={templateId} />
      <div className="flex-1">
        <label htmlFor="label" className="mb-1 block text-sm font-medium">
          New item label
        </label>
        <Input id="label" name="label" placeholder="e.g. Has valid safety policy" />
      </div>
      <div className="w-24">
        <label htmlFor="weight" className="mb-1 block text-sm font-medium">
          Weight
        </label>
        <Input id="weight" name="weight" type="number" min={1} max={100} defaultValue={1} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding..." : "Add item"}
      </Button>
      {state?.error && <span className="text-sm text-destructive">{state.error}</span>}
    </form>
  )
}
