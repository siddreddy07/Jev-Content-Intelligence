import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, AudioLines, ScanSearch } from "lucide-react"

import { TrendArea } from "@/components/charts"
import { StatusBadge } from "@/components/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { analysisHref, getDashboard } from "@/lib/data"
import { computeRun, initialElapsed } from "@/lib/pipeline"
import { cn } from "@/lib/utils"

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

/** Big number with a quieter unit, as in the design reference. */
function BigNumber({
  value,
  unit,
  className,
}: {
  value: string
  unit?: string
  className?: string
}) {
  return (
    <p
      className={cn(
        "font-heading font-medium tracking-tight tabular-nums",
        className
      )}
    >
      {value}
      {unit && (
        <span className="text-[0.55em] text-muted-foreground">{unit}</span>
      )}
    </p>
  )
}

export default async function DashboardPage() {
  const { stats, analyses } = await getDashboard()

  const top = analyses
    .filter((a) => a.status === "completed" && a.performanceLift !== null)
    .sort((a, b) => b.performanceLift! - a.performanceLift!)
    .slice(0, 3)

  const featured = analyses.find((a) => a.status === "running") ?? analyses[0]
  const run = featured ? computeRun(initialElapsed(featured.status)) : null
  const percent = run ? Math.round(run.overall * 100) : 0

  const tiles = [
    { label: "Creators analyzed", value: String(stats.creatorsAnalyzed) },
    { label: "Videos reviewed", value: compact.format(stats.videosAnalyzed) },
    {
      label: "Best vs recent",
      value: stats.averageLift === null ? "–" : `+${stats.averageLift}`,
      unit: stats.averageLift === null ? undefined : "%",
      hint: "Average across creators",
    },
    { label: "In progress", value: String(stats.inProgress) },
  ]

  return (
    <div className="space-y-8">
      <section className="grid gap-6 @4xl/main:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-muted-foreground">
                Updated just now
              </Badge>
              <Badge variant="secondary">{top.length} creators</Badge>
            </div>
            <h1 className="text-3xl font-semibold md:text-4xl">
              Top performing creators
            </h1>
            <p className="max-w-xl text-muted-foreground">
              Creators whose best videos beat their newest ones by the widest
              margin. Open one to see which openings made the difference.
            </p>
          </div>

          {top.length === 0 ? (
            <Empty className="rounded-3xl border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ScanSearch />
                </EmptyMedia>
                <EmptyTitle>No finished analyses yet</EmptyTitle>
                <EmptyDescription>
                  Analyze a channel and its results will appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="grid gap-4 @2xl/main:grid-cols-3">
              {top.map((a) => (
                <li key={a.id}>
                  <Card className="h-full gap-3 rounded-3xl py-0 pt-5">
                    <CardHeader className="flex-row items-start justify-between gap-3 px-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-10 rounded-xl after:rounded-xl">
                          <AvatarFallback className="rounded-xl bg-accent text-sm font-medium text-accent-foreground">
                            {initials(a.creator.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <CardTitle className="truncate font-heading text-base">
                            {a.creator.name}
                          </CardTitle>
                          <CardDescription className="truncate">
                            {a.creator.handle}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        asChild
                        size="icon"
                        variant="outline"
                        className="size-8 shrink-0 rounded-full"
                      >
                        <Link
                          href={analysisHref(a)}
                          aria-label={`Open ${a.creator.name} snapshot`}
                        >
                          <ArrowUpRight className="size-4" />
                        </Link>
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-2 px-5 pb-0">
                      <p className="text-sm text-muted-foreground">
                        Best vs recent
                      </p>
                      <BigNumber
                        value={`+${a.performanceLift}`}
                        unit="%"
                        className="text-5xl"
                      />
                      <p className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
                        {compact.format(a.creator.subscribers)} subscribers
                      </p>
                    </CardContent>
                    <TrendArea
                      minimal
                      seriesLabel="Relative views"
                      data={a.trend!.map((value, i) => ({
                        label: `Video ${i + 1}`,
                        value,
                      }))}
                      className="-mt-1 h-24 w-full"
                    />
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Card
          className="relative min-h-72 justify-between gap-6 rounded-3xl border border-primary/25 bg-card py-6"
          style={{
            backgroundImage:
              "radial-gradient(120% 80% at 100% 100%, oklch(0.5 0.16 292 / 0.5), transparent 62%)",
          }}
        >
          <CardHeader className="space-y-3 px-6">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <AudioLines className="size-5" aria-hidden />
            </span>
            <CardTitle className="font-heading text-2xl leading-tight">
              Analyze any YouTube channel
            </CardTitle>
            <CardDescription>
              Paste a link. In about ten minutes you&apos;ll see which opening
              lines win.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 px-6">
            {/* Plain GET form: /analyze reads ?url= and owns the validation. */}
            <form action="/analyze" className="space-y-2">
              <Input
                name="url"
                placeholder="youtube.com/@channelname"
                aria-label="YouTube channel link"
                inputMode="url"
                autoComplete="off"
                className="h-11 rounded-xl bg-background/60"
              />
              <Button type="submit" size="lg" className="w-full rounded-xl">
                Analyze channel
                <ArrowRight className="size-4" />
              </Button>
            </form>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full rounded-xl bg-background/30"
            >
              <Link href="/analyze?url=youtube.com/@mayabuilds">
                Try a sample channel
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {featured && run && (
        <section
          aria-labelledby="yours"
          className="space-y-4 rounded-3xl border bg-card/40 p-3 sm:p-5"
        >
          <div className="flex items-center justify-between gap-4 px-1">
            <h2
              id="yours"
              className="text-base font-medium text-muted-foreground"
            >
              Your analyses
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/analyses">
                View all {analyses.length}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <Card className="rounded-2xl p-0">
            <div className="grid gap-6 p-5 sm:p-6 @3xl/main:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Started {shortDate.format(new Date(featured.startedAt))}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-heading text-3xl font-medium">
                    {featured.creator.name}
                  </h3>
                  <StatusBadge value={featured.status} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Overall progress
                  </p>
                  <BigNumber
                    value={String(percent)}
                    unit="%"
                    className="text-6xl"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link href={analysisHref(featured)}>
                      {featured.status === "completed"
                        ? "View snapshot"
                        : "View progress"}
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/analyses">All analyses</Link>
                  </Button>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border bg-background/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-lg">Pipeline</p>
                    <p className="text-sm text-muted-foreground">
                      {run.current === null
                        ? "All steps complete"
                        : run.stages[run.current].title}
                    </p>
                  </div>
                  <Badge variant="secondary" className="tabular-nums">
                    {run.current === null ? "8" : run.current + 1} of 8
                  </Badge>
                </div>
                <ol className="flex gap-1.5" aria-label="Pipeline steps">
                  {run.stages.map((s) => (
                    <li
                      key={s.title}
                      title={`${s.title}: ${s.status}`}
                      className={cn(
                        "h-9 flex-1 rounded-md",
                        s.status === "completed" && "bg-primary",
                        s.status === "running" &&
                          "bg-primary/60 motion-safe:animate-pulse",
                        s.status === "failed" && "bg-destructive",
                        s.status === "pending" && "bg-muted"
                      )}
                    >
                      <span className="sr-only">
                        {s.title}: {s.status}
                      </span>
                    </li>
                  ))}
                </ol>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Discovery</span>
                  <span>Snapshot</span>
                </div>
              </div>
            </div>
          </Card>

          <dl className="grid grid-cols-2 gap-3 @3xl/main:grid-cols-4">
            {tiles.map((t) => (
              <Card key={t.label} className="gap-3 rounded-2xl py-4">
                <CardHeader className="flex-row items-center justify-between gap-2 px-4">
                  <dt className="text-sm text-muted-foreground">{t.label}</dt>
                  <Badge variant="secondary" className="shrink-0">
                    All time
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-1 px-4">
                  <dd>
                    <BigNumber
                      value={t.value}
                      unit={t.unit}
                      className="text-4xl"
                    />
                  </dd>
                  {t.hint && (
                    <dd className="text-xs text-muted-foreground">{t.hint}</dd>
                  )}
                </CardContent>
              </Card>
            ))}
          </dl>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Recent analyses</h2>
        </div>
        {analyses.length === 0 ? (
          <Empty className="rounded-3xl border border-dashed">
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
          <Card className="gap-0 overflow-hidden rounded-2xl py-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="pl-4">Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Best vs recent</TableHead>
                  <TableHead className="hidden pr-4 text-right @2xl/main:table-cell">
                    Started
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.slice(0, 5).map((a) => (
                  <TableRow key={a.id} className="relative hover:bg-muted/40">
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-accent text-xs font-medium text-accent-foreground">
                            {initials(a.creator.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link
                            href={analysisHref(a)}
                            className="block truncate font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
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
                    <TableCell className="hidden pr-4 text-right text-muted-foreground @2xl/main:table-cell">
                      {shortDate.format(new Date(a.startedAt))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>
    </div>
  )
}
