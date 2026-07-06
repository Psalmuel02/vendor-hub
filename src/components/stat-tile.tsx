import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
