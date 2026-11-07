import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ScanSearch } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { getDashboard, type AnalysisStatus } from "@/lib/data"
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
const lift = (n: number) => `${n > 0 ? "+" : ""}${n}%`

const statusStyle: Record<AnalysisStatus, { label: string; dot: string }> = {
  queued: { label: "Queued", dot: "bg-muted-foreground/50" },
  running: { label: "Running", dot: "bg-primary motion-safe:animate-pulse" },
  completed: { label: "Completed", dot: "bg-success" },
  failed: { label: "Failed", dot: "bg-destructive" },
}

export default async function DashboardPage() {
  const { stats, analyses } = await getDashboard()

  const statItems = [
    { label: "Creators analyzed", value: String(stats.creatorsAnalyzed) },
    {
      label: "Videos reviewed",
      value: compact.format(stats.videosAnalyzed),
    },
    {
      label: "Best vs recent videos",
      value: stats.averageLift === null ? "None yet" : lift(stats.averageLift),
      hint: "How much more the best 10 earn than the newest 10",
    },
    { label: "In progress", value: String(stats.inProgress) },
  ]

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="max-w-2xl text-3xl leading-tight font-semibold md:text-4xl">
          Which creator&apos;s opening lines do you want to understand?
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Paste a channel link. Jev compares their best and newest videos to
          show which opening lines win.
        </p>
        {/* Plain GET form: /analyze reads ?url= and owns the validation. */}
        <form
          action="/analyze"
          className="flex max-w-xl flex-col gap-2 sm:flex-row"
        >
          <Input
            name="url"
            placeholder="youtube.com/@creator"
            aria-label="YouTube channel URL"
            inputMode="url"
            autoComplete="off"
            className="h-10 bg-card"
          />
          <Button type="submit" className="h-10 gap-2">
            Analyze channel
            <ArrowRight className="size-4" />
          </Button>
        </form>
      </section>

      <dl className="grid grid-cols-2 gap-y-6 border-y py-6 lg:grid-cols-4">
        {statItems.map((s) => (
          <div
            key={s.label}
            className="space-y-1 lg:border-l lg:pl-6 lg:first:border-l-0 lg:first:pl-0"
          >
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
              {s.value}
            </dd>
            {s.hint && (
              <p className="text-xs text-muted-foreground">{s.hint}</p>
            )}
          </div>
        ))}
      </dl>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent analyses</h2>
        {analyses.length === 0 ? (
          <Empty className="border border-dashed">
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
              <Button asChild size="sm">
                <Link href="/analyze">Analyze a channel</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Videos
                </TableHead>
                <TableHead className="text-right">Best vs recent</TableHead>
                <TableHead className="hidden text-right md:table-cell">
                  Started
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyses.map((a) => (
                <TableRow key={a.id} className="relative hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-accent text-xs font-medium text-accent-foreground">
                          {a.creator.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link
                          href={`/analyses/${a.id}`}
                          className="block truncate font-medium after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
                        >
                          {a.creator.name}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {a.creator.handle} ·{" "}
                          {compact.format(a.creator.subscribers)} subscribers
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1.5">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          statusStyle[a.status].dot
                        )}
                        aria-hidden
                      />
                      {statusStyle[a.status].label}
                    </Badge>
                    {a.failureReason && (
                      <p className="mt-1 max-w-56 text-xs text-muted-foreground">
                        {a.failureReason}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {a.videosAnalyzed || "–"}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {a.performanceLift === null ? (
                      <span className="text-muted-foreground">–</span>
                    ) : (
                      lift(a.performanceLift)
                    )}
                  </TableCell>
                  <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                    {shortDate.format(new Date(a.startedAt))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}
