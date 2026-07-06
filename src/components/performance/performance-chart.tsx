"use client"

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type Point = { period: string; overallScore: number }

export function PerformanceChart({ data }: { data: Point[] }) {
  return (
    <div className="viz-root h-64 w-full">
      <style>{`
        .viz-root {
          --chart-line: #2a78d6;
          --chart-surface: #fcfcfb;
          --chart-grid: #e1e0d9;
          --chart-muted: #898781;
        }
        @media (prefers-color-scheme: dark) {
          .viz-root {
            --chart-line: #3987e5;
            --chart-surface: #1a1a19;
            --chart-grid: #2c2c2a;
            --chart-muted: #898781;
          }
        }
      `}</style>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="0" stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="period"
            interval={0}
            padding={{ left: 24, right: 24 }}
            tick={{ fill: "var(--chart-muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--chart-grid)" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "var(--chart-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(1)}%`, "Overall score"]}
            contentStyle={{
              background: "var(--chart-surface)",
              border: "1px solid var(--chart-grid)",
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="overallScore"
            stroke="var(--chart-line)"
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, stroke: "var(--chart-surface)", fill: "var(--chart-line)" }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--chart-surface)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
