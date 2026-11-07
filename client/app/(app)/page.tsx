import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ChevronRight, ScanSearch } from "lucide-react"

import { TrendArea } from "@/components/charts"
import { StatusBadge } from "@/components/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { analysisHref, getDashboard } from "@/lib/data"
import { computeRun, initialElapsed } from "@/lib/pipeline"

export const metadata: Metadata = { title: "Dashboard" }

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})
const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
})
const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")

export default async function DashboardPage() {
  const { stats, analyses } = await getDashboard()

  const top = analyses
    .filter((a) => a.status === "completed" && a.performanceLift !== null)
    .sort((a, b) => b.performanceLift! - a.performanceLift!)
    .slice(0, 3)

  const featured = analyses.find((a) => a.status === "running") ?? analyses[0]
  const run = featured ? computeRun(initialElapsed(featured.status)) : null
  const percent = run ? Math.round(run.overall * 100) : 0
  const stepNumber = run ? (run.current === null ? 8 : run.current + 1) : 0
  const recent = analyses.slice(0, 5)

  const tiles = [
    { label: "Creators", value: String(stats.creatorsAnalyzed) },
    { label: "Videos reviewed", value: compact.format(stats.videosAnalyzed) },
    {
      label: "Best vs recent",
      value: stats.averageLift === null ? "–" : `+${stats.averageLift}%`,
    },
    { label: "In progress", value: String(stats.inProgress) },
  ]

  return (
    <div className="space-y-4 @3xl/main:space-y-6">
      <header className="space-y-0.5">
        <h1 className="font-heading text-xl font-medium @3xl/main:text-3xl">
          Dashboard
        </h1>
        <p className="text-xs text-muted-foreground @3xl/main:text-sm">
          Which opening lines win, across the creators you&apos;ve analyzed.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 @4xl/main:grid-cols-[minmax(0,1fr)_20rem] @4xl/main:gap-6">
        {/* Start a new analysis. */}
        <Card
          className="gap-3 rounded-xl border border-primary/25 bg-card py-4 @3xl/main:rounded-2xl @4xl/main:col-start-2 @4xl/main:row-start-1"
          style={{
            backgroundImage:
              "radial-gradient(120% 80% at 100% 100%, oklch(0.5 0.16 292 / 0.45), transparent 62%)",
          }}
        >
          <CardHeader className="space-y-1 px-4">
            <CardTitle className="font-heading text-base @3xl/main:text-lg">
              Analyze a YouTube channel
            </CardTitle>
            <CardDescription className="text-xs @3xl/main:text-sm">
              Paste a link to see which openings win.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            {/* Plain GET form: /analyze reads ?url= and owns the validation. */}
            <form
              action="/analyze"
              className="flex flex-col gap-2 @md/main:flex-row @4xl/main:flex-col"
            >
              <Input
                name="url"
                placeholder="youtube.com/@channelname"
                aria-label="YouTube channel link"
                inputMode="url"
                autoComplete="off"
                className="bg-background/60"
              />
              <Button type="submit">
                Analyze
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-3 @3xl/main:space-y-4 @4xl/main:col-start-1 @4xl/main:row-span-2 @4xl/main:row-start-1">
          {/* One strip of totals. */}
          <dl className="grid grid-cols-2 divide-x divide-y rounded-xl border bg-card @3xl/main:grid-cols-4 @3xl/main:divide-y-0 @3xl/main:rounded-2xl">
            {tiles.map((t) => (
              <div
                key={t.label}
                className="min-w-0 px-3 py-2.5 @3xl/main:px-4 @3xl/main:py-3"
              >
                <dt className="truncate text-[11px] text-muted-foreground @3xl/main:text-xs">
                  {t.label}
                </dt>
                <dd className="font-heading text-lg font-medium tabular-nums @3xl/main:text-2xl">
                  {t.value}
                </dd>
              </div>
            ))}
          </dl>

          {/* Top creators. */}
          <Card className="gap-1 rounded-xl py-3 @3xl/main:rounded-2xl @3xl/main:py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-sm font-medium @3xl/main:text-base">
                Top creators
              </CardTitle>
              <CardDescription className="text-xs">
                Best videos vs newest videos
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 @3xl/main:px-3">
              {top.length === 0 ? (
                <Empty className="border border-dashed">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ScanSearch />
                    </EmptyMedia>
                    <EmptyTitle>No finished analyses yet</EmptyTitle>
                    <EmptyDescription>
                      Results will appear here.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ItemGroup>
                  {top.map((a) => (
                    <Item key={a.id} size="sm" asChild>
                      <Link
                        href={analysisHref(a)}
                        className="hover:bg-muted/50"
                      >
                        <ItemMedia>
                          <Avatar className="size-9 rounded-lg after:rounded-lg">
                            <AvatarFallback className="rounded-lg bg-accent text-xs font-medium text-accent-foreground">
                              {initials(a.creator.name)}
                            </AvatarFallback>
                          </Avatar>
                        </ItemMedia>
                        <ItemContent className="min-w-0 gap-0">
                          <ItemTitle className="block w-full truncate text-[13px] @3xl/main:text-sm">
                            {a.creator.name}
                          </ItemTitle>
                          <ItemDescription className="truncate text-xs">
                            {compact.format(a.creator.subscribers)} subscribers
                          </ItemDescription>
                        </ItemContent>
                        <ItemActions className="gap-3">
                          <TrendArea
                            minimal
                            seriesLabel="Relative views"
                            data={a.trend!.map((value, i) => ({
                              label: `Video ${i + 1}`,
                              value,
                            }))}
                            className="h-8 w-16 @3xl/main:w-24"
                          />
                          <span className="w-14 text-right font-heading text-base font-medium tabular-nums @3xl/main:text-lg">
                            +{a.performanceLift}%
                          </span>
                        </ItemActions>
                      </Link>
                    </Item>
                  ))}
                </ItemGroup>
              )}
            </CardContent>
          </Card>
        </div>

        {/* The analysis to look at next: a name, its step and a progress ring. */}
        {featured && run && (
          <Card className="rounded-xl py-0 @3xl/main:rounded-2xl @4xl/main:col-start-2 @4xl/main:row-start-2 @4xl/main:self-start">
            <Link
              href={analysisHref(featured)}
              aria-label={`${featured.creator.name}: step ${stepNumber} of 8. Open`}
              className="flex items-center gap-3 rounded-[inherit] px-4 py-3 transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {featured.creator.name}
              </span>
              <StatusBadge value={featured.status} />
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {stepNumber}/8
              </span>
              <svg
                viewBox="0 0 36 36"
                className="size-7 shrink-0 -rotate-90"
                role="img"
                aria-label="Progress"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  strokeWidth="4"
                  className="stroke-muted"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  strokeWidth="4"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={`${percent} 100`}
                  className="stroke-primary"
                />
              </svg>
            </Link>
          </Card>
        )}
      </div>

      {/* Recent analyses. */}
      <section aria-labelledby="recent" className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <h2 id="recent" className="text-sm font-medium @3xl/main:text-base">
            Recent analyses
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/analyses">
              View all {analyses.length}
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>

        {analyses.length === 0 ? (
          <Empty className="rounded-xl border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ScanSearch />
              </EmptyMedia>
              <EmptyTitle>No analyses yet</EmptyTitle>
              <EmptyDescription>
                Analyze a channel to see which opening lines drive its best
                videos.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/analyze">Analyze a channel</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            {/* Phones and tablets: compact rows. */}
            <Card className="gap-0 rounded-xl py-0 @3xl/main:hidden">
              <ItemGroup>
                {recent.map((a) => (
                  <Item
                    key={a.id}
                    size="sm"
                    asChild
                    className="rounded-none border-0 border-b last:border-b-0 hover:bg-muted/50"
                  >
                    <Link href={analysisHref(a)}>
                      <ItemContent className="min-w-0 gap-0.5">
                        <ItemTitle className="block w-full truncate text-[13px]">
                          {a.creator.name}
                        </ItemTitle>
                        <ItemDescription className="text-xs">
                          {shortDate.format(new Date(a.startedAt))}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions className="gap-3">
                        {a.performanceLift !== null && (
                          <span className="font-heading text-sm font-medium tabular-nums">
                            +{a.performanceLift}%
                          </span>
                        )}
                        <StatusBadge value={a.status} />
                      </ItemActions>
                    </Link>
                  </Item>
                ))}
              </ItemGroup>
            </Card>

            {/* Wide content areas: a table. */}
            <Card className="hidden gap-0 overflow-hidden rounded-2xl py-0 @3xl/main:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="pl-4">Creator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Best vs recent</TableHead>
                    <TableHead className="pr-4 text-right">Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((a) => (
                    <TableRow key={a.id} className="relative hover:bg-muted/40">
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-accent text-xs font-medium text-accent-foreground">
                              {initials(a.creator.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <Link
                              href={analysisHref(a)}
                              className="block truncate text-sm font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                            >
                              {a.creator.name}
                            </Link>
                            <p className="truncate text-xs text-muted-foreground">
                              {a.creator.handle}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={a.status} />
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {a.performanceLift === null ? (
                          <span className="text-muted-foreground">–</span>
                        ) : (
                          `+${a.performanceLift}%`
                        )}
                      </TableCell>
                      <TableCell className="pr-4 text-right text-muted-foreground">
                        {shortDate.format(new Date(a.startedAt))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </section>
    </div>
  )
}
