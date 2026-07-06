"use client"

import { useActionState, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { uploadVendorDocument, type UploadDocumentState } from "./actions"

export function UploadDocumentForm() {
  const [state, formAction, isPending] = useActionState<UploadDocumentState, FormData>(
    uploadVendorDocument,
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
    <Card>
      <CardHeader>
        <CardTitle>Upload a document</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="type">Document type</FieldLabel>
              <Input id="type" name="type" placeholder="e.g. CAC Certificate" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="expiryDate">Expiry date (optional)</FieldLabel>
              <Input id="expiryDate" name="expiryDate" type="date" />
            </Field>
            <Field>
              <FieldLabel htmlFor="file">File</FieldLabel>
              <Input id="file" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg" required />
            </Field>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Uploading..." : "Upload document"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
