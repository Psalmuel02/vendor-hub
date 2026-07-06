"use client"

import { useActionState, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ChecklistAnswer } from "@/lib/checklist"
import { scoreChecklistResponse, type ChecklistActionState } from "@/lib/actions/checklist-response"

type Item = { id: string; label: string; weight: number }

export function ChecklistScoringForm({
  responseId,
  items,
  answers,
  onSuccess,
}: {
  responseId: string
  items: Item[]
  answers: ChecklistAnswer[]
  onSuccess?: () => void
}) {
  const [state, formAction, isPending] = useActionState<ChecklistActionState, FormData>(
    scoreChecklistResponse,
    undefined
  )
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      onSuccess?.()
    }
    wasPending.current = isPending
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, state])

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="responseId" value={responseId} />
      <div className="space-y-4">
        {items.map((item) => {
          const answer = answers.find((a) => a.itemId === item.id)
          return (
            <div key={item.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{item.label}</p>
                <span className="text-sm text-muted-foreground">Weight {item.weight}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Vendor answered: <span className="font-medium">{answer?.answer ?? "NO"}</span>
                {answer?.note && <> — &quot;{answer.note}&quot;</>}
              </p>
              <Field className="mt-2 max-w-32">
                <FieldLabel htmlFor={`score-${item.id}`}>Score (0–{item.weight})</FieldLabel>
                <Input
                  id={`score-${item.id}`}
                  name={`score-${item.id}`}
                  type="number"
                  min={0}
                  max={item.weight}
                  defaultValue={answer?.answer === "YES" ? item.weight : 0}
                />
              </Field>
            </div>
          )
        })}
      </div>

      <Field>
        <FieldLabel htmlFor="comment">Comment</FieldLabel>
        <Textarea id="comment" name="comment" placeholder="Required when sending back" />
      </Field>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" name="decision" value="REJECTED" variant="destructive" disabled={isPending}>
          Send Back
        </Button>
        <Button type="submit" name="decision" value="APPROVED" disabled={isPending}>
          Submit Scores
        </Button>
      </div>
    </form>
  )
}
