"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ReviewDocumentForm } from "@/components/review-document-form"

export function ReviewDocumentDialog({
  documentId,
  documentType,
}: {
  documentId: string
  documentType: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            Review
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review document</DialogTitle>
          <DialogDescription>{documentType}</DialogDescription>
        </DialogHeader>
        <ReviewDocumentForm documentId={documentId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
