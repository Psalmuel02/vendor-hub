"use client"

import { useActionState, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addKpiTemplate, type KpiTemplateState } from "@/lib/actions/kpi-template"

export function AddKpiForm() {
  const [state, formAction, isPending] = useActionState<KpiTemplateState, FormData>(
    addKpiTemplate,
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
      <div className="flex-1">
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          New KPI name
        </label>
        <Input id="name" name="name" placeholder="e.g. Delivery Timeliness" />
      </div>
      <div className="w-24">
        <label htmlFor="weight" className="mb-1 block text-sm font-medium">
          Weight
        </label>
        <Input id="weight" name="weight" type="number" min={1} max={100} defaultValue={1} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding..." : "Add KPI"}
      </Button>
      {state?.error && <span className="text-sm text-destructive">{state.error}</span>}
    </form>
  )
}
