"use client"

import { useActionState, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { reviewOnboarding, type ReviewOnboardingState } from "@/lib/actions/onboarding-review"

export function ReviewOnboardingForm({
  vendorId,
  onSuccess,
}: {
  vendorId: string
  onSuccess?: () => void
}) {
  const [state, formAction, isPending] = useActionState<ReviewOnboardingState, FormData>(
    reviewOnboarding,
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
      <input type="hidden" name="vendorId" value={vendorId} />
      <Field>
        <FieldLabel htmlFor={`onboarding-comment-${vendorId}`}>Comment</FieldLabel>
        <Textarea
          id={`onboarding-comment-${vendorId}`}
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
