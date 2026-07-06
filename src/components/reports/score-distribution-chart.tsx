"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type Point = { bucket: string; count: number }

export function ScoreDistributionChart({ data }: { data: Point[] }) {
  return (
    <div className="viz-root h-64 w-full">
      <style>{`
        .viz-root {
          --chart-bar: #2a78d6;
          --chart-surface: #fcfcfb;
          --chart-grid: #e1e0d9;
          --chart-muted: #898781;
        }
        @media (prefers-color-scheme: dark) {
          .viz-root {
            --chart-bar: #3987e5;
            --chart-surface: #1a1a19;
            --chart-grid: #2c2c2a;
            --chart-muted: #898781;
          }
        }
      `}</style>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="0" stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="bucket"
            interval={0}
            tick={{ fill: "var(--chart-muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--chart-grid)" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--chart-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: "var(--chart-surface)",
              border: "1px solid var(--chart-grid)",
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Bar dataKey="count" fill="var(--chart-bar)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
