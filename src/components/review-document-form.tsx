"use client"

import { useActionState, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { reviewDocument, type ReviewDocumentState } from "@/lib/actions/documents"

export function ReviewDocumentForm({
  documentId,
  onSuccess,
}: {
  documentId: string
  onSuccess?: () => void
}) {
  const [state, formAction, isPending] = useActionState<ReviewDocumentState, FormData>(
    reviewDocument,
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
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="documentId" value={documentId} />
      <Field>
        <FieldLabel htmlFor={`comment-${documentId}`}>Comment</FieldLabel>
        <Textarea
          id={`comment-${documentId}`}
          name="comment"
          placeholder="Required when rejecting"
        />
      </Field>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          name="decision"
          value="REJECTED"
          variant="destructive"
          disabled={isPending}
        >
          Reject
        </Button>
        <Button type="submit" name="decision" value="APPROVED" disabled={isPending}>
          Approve
        </Button>
      </div>
    </form>
  )
}
