"use client"

import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { submitChecklistResponse, type ChecklistActionState } from "@/lib/actions/checklist-response"

type Item = { id: string; label: string; weight: number }

export function ChecklistFillForm({ items }: { items: Item[] }) {
  const [state, formAction, isPending] = useActionState<ChecklistActionState, FormData>(
    submitChecklistResponse,
    undefined
  )
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((item) => [item.id, "NO"]))
  )

  return (
    <form action={formAction} className="space-y-6">
      <FieldGroup>
        {items.map((item) => (
          <Field key={item.id}>
            <FieldLabel htmlFor={`answer-${item.id}`}>
              {item.label} <span className="text-muted-foreground">(weight {item.weight})</span>
            </FieldLabel>
            <input type="hidden" name={`answer-${item.id}`} value={answers[item.id]} readOnly />
            <Select
              value={answers[item.id]}
              onValueChange={(value) =>
                setAnswers((prev) => ({ ...prev, [item.id]: value as string }))
              }
            >
              <SelectTrigger id={`answer-${item.id}`} className="w-32">
                <SelectValue>{(value: string) => (value === "YES" ? "Yes" : "No")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YES">Yes</SelectItem>
                <SelectItem value="NO">No</SelectItem>
              </SelectContent>
            </Select>
            <Input name={`note-${item.id}`} placeholder="Optional note" />
          </Field>
        ))}
      </FieldGroup>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit for Review"}
      </Button>
    </form>
  )
}
