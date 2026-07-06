import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getActiveChecklistTemplate } from "@/lib/checklist"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { AddItemForm } from "./add-item-form"
import { createChecklistTemplate } from "@/lib/actions/checklist-template"
import { ItemRow } from "./item-row"

export default async function ChecklistBuilderPage() {
  const session = await auth()
  if (session?.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const template = await getActiveChecklistTemplate()

  if (!template) {
    return (
      <Card>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            No checklist template exists yet. Create one to get started.
          </p>
          <form action={createChecklistTemplate}>
            <Button type="submit">Create checklist template</Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{template.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {template.items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </TableBody>
        </Table>

        <AddItemForm templateId={template.id} />
      </CardContent>
    </Card>
  )
}
