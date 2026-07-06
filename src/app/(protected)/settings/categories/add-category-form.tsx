"use client"

import { useActionState, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createCategory, type CategoryState } from "@/lib/actions/category-management"

export function AddCategoryForm() {
  const [state, formAction, isPending] = useActionState<CategoryState, FormData>(
    createCategory,
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
          New category name
        </label>
        <Input id="name" name="name" placeholder="e.g. Consultant" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding..." : "Add category"}
      </Button>
      {state?.error && <span className="text-sm text-destructive">{state.error}</span>}
    </form>
  )
}
