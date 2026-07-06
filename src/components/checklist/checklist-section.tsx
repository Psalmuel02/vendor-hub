import { prisma } from "@/lib/prisma"
import { getActiveChecklistTemplate, type ChecklistAnswer } from "@/lib/checklist"
import { Card, CardContent } from "@/components/ui/card"

import { ChecklistFillForm } from "./checklist-fill-form"
import { ChecklistScoringForm } from "./checklist-scoring-form"

export async function ChecklistSection({
  vendorId,
  viewerRole,
}: {
  vendorId: string
  viewerRole: "VENDOR" | "STAFF"
}) {
  const template = await getActiveChecklistTemplate()
  if (!template) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">No checklist template has been configured yet.</p>
        </CardContent>
      </Card>
    )
  }

  const response = await prisma.checklistResponse.findFirst({
    where: { vendorId, templateId: template.id },
    orderBy: { submittedAt: "desc" },
  })

  const items = template.items

  if (viewerRole === "VENDOR") {
    if (!response || response.status === "REJECTED") {
      return (
        <Card>
          <CardContent className="space-y-4">
            {response?.status === "REJECTED" && (
              <p className="text-sm text-destructive">
                Your previous submission was sent back — please review and resubmit.
              </p>
            )}
            <ChecklistFillForm items={items} />
          </CardContent>
        </Card>
      )
    }

    const answers = response.answers as unknown as ChecklistAnswer[]
    return (
      <Card>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {response.status === "PENDING"
              ? "Submitted — awaiting review."
              : `Reviewed. Total score: ${response.totalScore ?? 0} / ${items.reduce((s, i) => s + i.weight, 0)}`}
          </p>
          <div className="space-y-2">
            {items.map((item) => {
              const answer = answers.find((a) => a.itemId === item.id)
              return (
                <div key={item.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-muted-foreground">
                    Answer: {answer?.answer ?? "NO"}
                    {answer?.note && <> — &quot;{answer.note}&quot;</>}
                    {answer?.score != null && <> — Score: {answer.score}</>}
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Staff viewer (Admin/Approver)
  if (!response) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">This vendor hasn&apos;t submitted the checklist yet.</p>
        </CardContent>
      </Card>
    )
  }

  const answers = response.answers as unknown as ChecklistAnswer[]

  if (response.status === "PENDING") {
    return (
      <Card>
        <CardContent>
          <ChecklistScoringForm responseId={response.id} items={items} answers={answers} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {response.status === "APPROVED"
            ? `Scored. Total score: ${response.totalScore ?? 0} / ${items.reduce((s, i) => s + i.weight, 0)}`
            : "This submission was sent back to the vendor."}
        </p>
        <div className="space-y-2">
          {items.map((item) => {
            const answer = answers.find((a) => a.itemId === item.id)
            return (
              <div key={item.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{item.label}</p>
                <p className="text-muted-foreground">
                  Answer: {answer?.answer ?? "NO"}
                  {answer?.note && <> — &quot;{answer.note}&quot;</>}
                  {answer?.score != null && <> — Score: {answer.score}</>}
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
