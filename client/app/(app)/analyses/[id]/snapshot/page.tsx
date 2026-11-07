import type { Metadata } from "next"
import Link from "next/link"

import { TrendArea } from "@/components/charts"
import { SnapshotInsights } from "@/components/snapshot-insights"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getAnalysis } from "@/lib/data"
import { getSnapshot } from "@/lib/snapshot"

export const metadata: Metadata = { title: "Creator snapshot" }

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})
const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

export default async function SnapshotPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const [{ id }, { name }] = await Promise.all([params, searchParams])
  const analysis = await getAnalysis(id)
  const s = getSnapshot()

  const creator =
    analysis?.creator.name ?? (typeof name === "string" ? name : "This creator")

  const byDate = [...s.videos].sort((a, b) =>
    a.publishedAt.localeCompare(b.publishedAt)
  )
  const winning = s.patterns.filter((p) => p.lift > 0)

  const metrics = [
    { label: "Top 10 average", value: compact.format(s.comparison.topAvg) },
    {
      label: "Latest 10 average",
      value: compact.format(s.comparison.latestAvg),
    },
    {
      label: "Winning openings",
      value: `${s.alignment.latestWinning} of 10`,
    },
  ]

  return (
    <div className="space-y-3 @3xl/main:space-y-6">
      <Card className="rounded-2xl p-0 @3xl/main:rounded-3xl">
        <div className="grid grid-cols-1 gap-4 p-4 @3xl/main:grid-cols-[minmax(0,1fr)_22rem] @3xl/main:gap-6 @3xl/main:p-8">
          <div className="min-w-0 space-y-3 @3xl/main:space-y-5">
            <h1 className="font-heading text-lg font-medium @3xl/main:text-3xl">
              {creator}
            </h1>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground @3xl/main:text-sm">
                Best vs recent
              </p>
              <p className="font-heading text-4xl font-medium tracking-tight tabular-nums @3xl/main:text-7xl">
                +{s.comparison.lift}
                <span className="text-[0.55em] text-muted-foreground">%</span>
              </p>
              <p className="max-w-sm text-xs text-muted-foreground @3xl/main:text-sm">
                The top 10 videos earn {s.comparison.lift}% more views than the
                latest 10.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/videos">Explore videos</Link>
            </Button>
          </div>

          <div className="min-w-0 space-y-2">
            <p className="text-xs text-muted-foreground @3xl/main:text-sm">
              Views per video,{" "}
              {shortDate.format(new Date(byDate[0].publishedAt))} to{" "}
              {shortDate.format(
                new Date(byDate[byDate.length - 1].publishedAt)
              )}
            </p>
            <TrendArea
              minimal
              showLabel
              seriesLabel="Views"
              data={byDate.map((x) => ({
                label: x.title,
                value: x.views,
              }))}
              className="h-28 w-full @3xl/main:h-36"
            />
          </div>
        </div>
      </Card>

      <dl className="grid grid-cols-3 divide-x rounded-xl border bg-card @3xl/main:rounded-2xl">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="min-w-0 space-y-1 px-3 py-3 @3xl/main:px-5 @3xl/main:py-4"
          >
            <dt className="truncate text-[11px] text-muted-foreground @3xl/main:text-sm">
              {m.label}
            </dt>
            <dd className="font-heading text-xl font-medium tracking-tight tabular-nums @3xl/main:text-3xl">
              {m.value}
            </dd>
          </div>
        ))}
      </dl>

      <Card className="gap-1 rounded-xl py-3 @3xl/main:gap-2 @3xl/main:rounded-2xl @3xl/main:py-4">
        <CardHeader>
          <h2 className="text-sm font-medium @3xl/main:text-base">
            Openings that work
          </h2>
          <p className="text-xs text-muted-foreground @3xl/main:text-sm">
            How much more each opening earns than average, and how often the top
            10 and latest 10 use it.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {winning.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-4 py-2 @3xl/main:py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium @3xl/main:text-base">
                    {p.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground tabular-nums @3xl/main:text-xs">
                    Top 10: {p.topCount} · Latest 10: {p.latestCount}
                  </p>
                </div>
                <p className="font-heading text-lg font-medium tabular-nums @3xl/main:text-2xl">
                  +{p.lift}%
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <SnapshotInsights
        summary={s.aiSummary}
        patterns={s.contentPatterns}
        blindSpots={s.blindSpots}
        videos={s.videos}
      />

      <p className="text-[11px] text-muted-foreground @3xl/main:text-xs">
        Numbers are measured from YouTube data and transcripts. The AI card is
        written by AI from that data.
      </p>
    </div>
  )
}
