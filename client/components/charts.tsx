"use client"

import { useId } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

/**
 * Area chart of one series. `minimal` drops axes and grid for sparkline use;
 * the tooltip still works.
 */
export function TrendArea({
  data,
  seriesLabel,
  minimal = false,
  showLabel = false,
  className,
}: {
  data: { label: string; value: number }[]
  /** Name shown in the tooltip, e.g. "Views". */
  seriesLabel: string
  minimal?: boolean
  /** Keep the tooltip heading (the x label) even when `minimal`. */
  showLabel?: boolean
  className?: string
}) {
  const gradient = `fill-${useId().replace(/:/g, "")}`
  const config = {
    value: { label: seriesLabel, color: "var(--chart-1)" },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className={className}>
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{ left: 0, right: 0, top: 6, bottom: 0 }}
      >
        <defs>
          <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-value)"
              stopOpacity={0.35}
            />
            <stop
              offset="100%"
              stopColor="var(--color-value)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        {!minimal && <CartesianGrid vertical={false} strokeDasharray="3 3" />}
        {!minimal && (
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={36}
          />
        )}
        <YAxis hide domain={["dataMin - 5%", "dataMax + 5%"]} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="line"
              hideLabel={minimal && !showLabel}
            />
          }
        />
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={2}
          fill={`url(#${gradient})`}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}
