import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { AddKpiForm } from "./add-kpi-form"
import { KpiItemRow } from "./kpi-item-row"

export default async function KpiManagerPage() {
  const session = await auth()
  if (session?.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const kpis = await prisma.kpiTemplate.findMany({ orderBy: { weight: "desc" } })

  return (
    <Card>
      <CardHeader>
        <CardTitle>KPI Templates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {kpis.map((kpi) => (
              <KpiItemRow key={kpi.id} kpi={kpi} />
            ))}
          </TableBody>
        </Table>

        <AddKpiForm />
      </CardContent>
    </Card>
  )
}
