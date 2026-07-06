import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { PerformanceChart } from "./performance-chart"

export async function PerformanceHistory({ vendorId }: { vendorId: string }) {
  const reviews = await prisma.performanceReview.findMany({
    where: { vendorId },
    orderBy: { createdAt: "asc" },
  })

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">No performance reviews yet.</p>
        </CardContent>
      </Card>
    )
  }

  const chartData = reviews.map((review) => ({
    period: review.period,
    overallScore: review.overallScore,
  }))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Score over time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceChart data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Overall Score</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...reviews].reverse().map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">{review.period}</TableCell>
                  <TableCell>{review.overallScore.toFixed(1)}%</TableCell>
                  <TableCell className="text-muted-foreground">
                    {review.comment ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {review.createdAt.toLocaleDateString()}
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
