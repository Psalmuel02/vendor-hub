import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { AuditLogFilters } from "./audit-log-filters"

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>
}) {
  const [{ action }, session] = await Promise.all([searchParams, auth()])
  if (session?.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const logs = await prisma.auditLog.findMany({
    where: action ? { action } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  const actorIds = [...new Set(logs.map((log) => log.actorId))]
  const actors = actorIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } })
    : []
  const actorNames = new Map(actors.map((a) => [a.id, a.name]))

  const distinctActions = await prisma.auditLog.findMany({
    distinct: ["action"],
    select: { action: true },
    orderBy: { action: "asc" },
  })

  return (
    <div className="space-y-4">
      <AuditLogFilters actions={distinctActions.map((a) => a.action)} />
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow>
                  <td colSpan={4} className="p-6 text-center text-sm text-muted-foreground">
                    No audit entries yet.
                  </td>
                </TableRow>
              )}
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground">
                    {log.createdAt.toLocaleString()}
                  </TableCell>
                  <TableCell>{actorNames.get(log.actorId) ?? "Unknown"}</TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.targetType} ({log.targetId.slice(0, 8)}…)
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
