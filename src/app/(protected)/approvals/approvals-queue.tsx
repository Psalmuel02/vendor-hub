"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChecklistScoringForm } from "@/components/checklist/checklist-scoring-form"
import { ReviewDocumentForm } from "@/components/review-document-form"
import { ReviewOnboardingForm } from "@/components/review-onboarding-form"
import type { ChecklistAnswer } from "@/lib/checklist"

type Vendor = { id: string; companyName: string }
type BaseItem = { id: string; createdAt: Date; vendor: Vendor }

export type ApprovalItem =
  | (BaseItem & { type: "ONBOARDING" })
  | (BaseItem & { type: "DOCUMENT"; document: { id: string; type: string } })
  | (BaseItem & {
      type: "CHECKLIST"
      response: { id: string; answers: ChecklistAnswer[] }
      items: { id: string; label: string; weight: number }[]
    })

const TYPE_LABELS: Record<ApprovalItem["type"], string> = {
  ONBOARDING: "Onboarding",
  DOCUMENT: "Document",
  CHECKLIST: "Checklist",
}

function detailLabel(item: ApprovalItem) {
  if (item.type === "DOCUMENT") return item.document.type
  if (item.type === "CHECKLIST") return "Compliance checklist"
  return "New vendor application"
}

export function ApprovalsQueue({ items }: { items: ApprovalItem[] }) {
  const [tab, setTab] = useState("all")
  const [openItemId, setOpenItemId] = useState<string | null>(null)

  const filtered = tab === "all" ? items : items.filter((item) => item.type === tab.toUpperCase())
  const openItem = items.find((item) => item.id === openItemId) ?? null

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(value) => setTab(value as string)}>
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="onboarding">
            Onboarding ({items.filter((i) => i.type === "ONBOARDING").length})
          </TabsTrigger>
          <TabsTrigger value="document">
            Documents ({items.filter((i) => i.type === "DOCUMENT").length})
          </TabsTrigger>
          <TabsTrigger value="checklist">
            Checklists ({items.filter((i) => i.type === "CHECKLIST").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">
                    Nothing pending here.
                  </td>
                </TableRow>
              )}
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.vendor.companyName}</TableCell>
                  <TableCell>{TYPE_LABELS[item.type]}</TableCell>
                  <TableCell className="text-muted-foreground">{detailLabel(item)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => setOpenItemId(item.id)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={openItem != null} onOpenChange={(open) => !open && setOpenItemId(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto p-6">
          {openItem && (
            <>
              <SheetHeader className="p-0">
                <SheetTitle>{openItem.vendor.companyName}</SheetTitle>
                <SheetDescription>
                  {TYPE_LABELS[openItem.type]} — {detailLabel(openItem)}
                </SheetDescription>
              </SheetHeader>
              {openItem.type === "ONBOARDING" && (
                <ReviewOnboardingForm
                  vendorId={openItem.vendor.id}
                  onSuccess={() => setOpenItemId(null)}
                />
              )}
              {openItem.type === "DOCUMENT" && (
                <ReviewDocumentForm
                  documentId={openItem.document.id}
                  onSuccess={() => setOpenItemId(null)}
                />
              )}
              {openItem.type === "CHECKLIST" && (
                <ChecklistScoringForm
                  responseId={openItem.response.id}
                  items={openItem.items}
                  answers={openItem.response.answers}
                  onSuccess={() => setOpenItemId(null)}
                />
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
