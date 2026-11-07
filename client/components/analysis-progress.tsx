"use client"

import Link from "next/link"
import { useEffect, useState, useSyncExternalStore } from "react"
import {
  ArrowRight,
  AudioLines,
  Captions,
  CheckCircle2,
  Circle,
  FileText,
  GitCompareArrows,
  History,
  ListChecks,
  ListFilter,
  RotateCcw,
  ScanText,
  Search,
  XCircle,
  type LucideIcon,
} from "lucide-react"

import {
  FAIL_MESSAGE,
  FAIL_STAGE,
  TOTAL_SECONDS,
  computeRun,
  formatElapsed,
  initialElapsed,
  stageStart,
  type StageStatus,
} from "@/lib/pipeline"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/status-badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

/**
 * Run state (start time + retry count) lives in sessionStorage so a refresh
 * continues the same run. The backend will replace this with SSE events.
 */
type Saved = { start: number; attempt: number }
/** Wall clock, kept outside render so components stay pure. */
const clock = () => Date.now()
const listeners = new Set<() => void>()
const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => void listeners.delete(cb)
}
function save(key: string, value: Saved) {
  sessionStorage.setItem(key, JSON.stringify(value))
  listeners.forEach((l) => l())
}

const stageIcons: LucideIcon[] = [
  Search,
  ListFilter,
  ListChecks,
  AudioLines,
  Captions,
  ScanText,
  GitCompareArrows,
  FileText,
]

const statusLabel: Record<StageStatus, string> = {
  pending: "Waiting",
  running: "In progress",
  completed: "Done",
  failed: "Failed",
}

function StatusIcon({ status }: { status: StageStatus }) {
  return (
    <>
      {status === "completed" && (
        <CheckCircle2 className="size-5 text-success" aria-hidden />
      )}
      {status === "running" && (
        <Spinner className="size-5 text-primary" aria-hidden />
      )}
      {status === "pending" && (
        <Circle className="size-5 text-muted-foreground/40" aria-hidden />
      )}
      {status === "failed" && (
        <XCircle className="size-5 text-destructive" aria-hidden />
      )}
      <span className="sr-only">{statusLabel[status]}</span>
    </>
  )
}

export function AnalysisProgress({
  id,
  name,
  handle,
  seedStatus,
  failureReason,
}: {
  id: string
  name: string
  handle?: string
  /** Status of a known (seeded) analysis. Unknown ids start from scratch. */
  seedStatus?: string
  failureReason?: string
}) {
  const key = `jev:run:${id}`
  const raw = useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(key) ?? "",
    () => null
  )
  const [now, setNow] = useState(() => clock())

  useEffect(() => {
    if (raw === "") {
      save(key, {
        start: clock() - initialElapsed(seedStatus) * 1000,
        attempt: 0,
      })
    }
  }, [raw, key, seedStatus])

  const saved: Saved | null = raw ? JSON.parse(raw) : null
  const elapsed = saved ? Math.max(0, (now - saved.start) / 1000) : 0
  const failAt =
    seedStatus === "failed" && saved?.attempt === 0 ? FAIL_STAGE : undefined
  const run = computeRun(elapsed, failAt)

  useEffect(() => {
    if (!saved || run.status !== "running") return
    const t = setInterval(() => setNow(clock()), 500)
    return () => clearInterval(t)
  }, [saved, run.status])

  function retry() {
    if (!saved || run.current === null) return
    save(key, {
      start: clock() - stageStart(run.current) * 1000,
      attempt: saved.attempt + 1,
    })
    setNow(clock())
  }

  const percent = Math.round(run.overall * 100)
  const current = run.current !== null ? run.stages[run.current] : null
  const CurrentIcon = run.current !== null ? stageIcons[run.current] : FileText
  const secondsLeft = Math.max(0, Math.ceil(TOTAL_SECONDS - elapsed))

  // Newest first: what just finished, then what is happening now.
  const activity = [
    ...run.stages
      .filter((s) => s.status === "completed")
      .map((s) => ({ time: s.finishedAt!, text: s.message!, tone: "done" })),
    ...run.stages
      .filter((s) => s.status === "failed")
      .map((s) => ({
        time: s.finishedAt!,
        text: `${s.title} failed.`,
        tone: "failed",
      })),
  ].sort((a, b) => b.time - a.time)

  if (!saved) {
    return (
      <div className="mx-auto max-w-5xl space-y-6" aria-busy="true">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const initials = name
    .replace(/^@/, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const stepsList = (
    <ItemGroup className="gap-0.5" aria-label="Analysis steps">
      {run.stages.map((stage, i) => (
        <Item
          key={stage.title}
          size="sm"
          aria-current={stage.status === "running" ? "step" : undefined}
          className={cn(
            "px-2 py-2",
            stage.status === "running" && "bg-accent/60",
            stage.status === "failed" && "bg-destructive/5"
          )}
        >
          <ItemMedia>
            <StatusIcon status={stage.status} />
          </ItemMedia>
          <ItemContent className="min-w-0 gap-1">
            <ItemTitle
              className={cn(
                "w-full truncate text-[13px] @3xl/main:text-sm",
                stage.status === "pending" && "text-muted-foreground"
              )}
            >
              {i + 1}. {stage.title}
            </ItemTitle>
            {stage.status === "running" && (
              <Progress
                value={Math.round(stage.progress! * 100)}
                aria-label={`${stage.title} progress`}
                className="h-1"
              />
            )}
          </ItemContent>
          <ItemActions className="text-[11px] text-muted-foreground tabular-nums @3xl/main:text-xs">
            {stage.status === "pending"
              ? "Waiting"
              : stage.status === "running"
                ? stage.detail
                : `${stage.seconds}s`}
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  )

  const activityList = (
    <ol className="space-y-2.5">
      {run.status === "running" && current && (
        <li className="flex gap-3 text-[13px]">
          <span className="w-10 shrink-0 text-muted-foreground tabular-nums">
            {formatElapsed(elapsed)}
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <Spinner className="size-3.5 shrink-0 text-primary" aria-hidden />
            <span className="truncate">
              {current.title}
              {current.detail && ` · ${current.detail}`}
            </span>
          </span>
        </li>
      )}
      {activity.map((a) => (
        <li key={a.text} className="flex gap-3 text-[13px]">
          <span className="w-10 shrink-0 text-muted-foreground tabular-nums">
            {formatElapsed(a.time)}
          </span>
          <span className={cn(a.tone === "failed" && "text-destructive")}>
            {a.text}
          </span>
        </li>
      ))}
      {activity.length === 0 && run.status !== "running" && (
        <li className="text-[13px] text-muted-foreground">Nothing yet.</li>
      )}
    </ol>
  )

  const stats = [
    { label: "Overall", value: `${percent}%` },
    {
      label: "This step",
      value:
        run.status === "completed"
          ? "Complete"
          : (current?.detail ?? "Just started"),
    },
    {
      label: run.status === "running" ? "Time left" : "Time",
      value:
        run.status === "running"
          ? `${secondsLeft}s`
          : run.status === "completed"
            ? formatElapsed(TOTAL_SECONDS)
            : "Paused",
    },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-3 @3xl/main:space-y-6">
      <Card className="gap-4 rounded-xl py-4 @3xl/main:gap-6 @3xl/main:rounded-2xl @3xl/main:py-6">
        <CardHeader className="px-4 @3xl/main:px-6">
          <div className="flex items-center gap-3">
            <Avatar className="size-9 @3xl/main:size-10">
              <AvatarFallback className="bg-accent text-xs font-medium text-accent-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="truncate font-heading text-base @3xl/main:text-lg">
                {name}
              </CardTitle>
              {handle && (
                <CardDescription className="truncate text-xs">
                  {handle}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
            <StatusBadge value={run.status} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-4 @3xl/main:space-y-6 @3xl/main:px-6">
          <div className="flex items-start gap-3 @3xl/main:gap-4">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl @3xl/main:size-12",
                run.status === "completed"
                  ? "bg-success/15 text-success"
                  : run.status === "failed"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-accent text-accent-foreground"
              )}
            >
              {run.status === "completed" ? (
                <CheckCircle2 className="size-5 @3xl/main:size-6" aria-hidden />
              ) : (
                <CurrentIcon className="size-5 @3xl/main:size-6" aria-hidden />
              )}
            </span>
            <div aria-live="polite" className="min-w-0 space-y-0.5">
              <p className="text-xs text-muted-foreground @3xl/main:text-sm">
                {run.status === "completed"
                  ? "All 8 steps done"
                  : `${run.status === "failed" ? "Stopped at step" : "Step"} ${run.current! + 1} of 8`}
              </p>
              <h2 className="font-heading text-lg leading-snug font-semibold @3xl/main:text-2xl">
                {run.status === "completed"
                  ? "Your snapshot is ready"
                  : current!.title}
              </h2>
              <p className="text-[13px] text-muted-foreground @3xl/main:text-base">
                {run.status === "completed"
                  ? `Finished in ${formatElapsed(TOTAL_SECONDS)}. See which openings work and where recent videos drift.`
                  : current!.description}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Progress
              value={percent}
              aria-label="Overall progress"
              className="h-1.5 @3xl/main:h-2"
            />
            <dl className="grid grid-cols-3 divide-x rounded-xl border">
              {stats.map((s) => (
                <div key={s.label} className="min-w-0 px-3 py-2">
                  <dt className="text-[11px] text-muted-foreground">
                    {s.label}
                  </dt>
                  <dd className="truncate font-heading text-sm font-medium tabular-nums @3xl/main:text-lg">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {run.status === "failed" && (
            <Alert variant="destructive">
              <XCircle />
              <AlertTitle>{current!.title} didn&apos;t finish</AlertTitle>
              <AlertDescription>
                {failureReason ?? FAIL_MESSAGE} Trying again picks up from this
                step.
              </AlertDescription>
            </Alert>
          )}
          {run.status === "running" && (
            <p className="text-xs text-muted-foreground">
              You can leave this page. The analysis keeps running.
            </p>
          )}
        </CardContent>

        <CardFooter className="gap-2 px-4 @3xl/main:px-6">
          {run.status === "completed" && (
            <Button asChild className="flex-1 @3xl/main:flex-none">
              <Link
                href={`/analyses/${id}/snapshot?name=${encodeURIComponent(name)}`}
              >
                View creator snapshot
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
          {run.status === "failed" && (
            <Button className="flex-1 @3xl/main:flex-none" onClick={retry}>
              <RotateCcw className="size-4" />
              Try again
            </Button>
          )}
          <Button
            asChild
            variant="outline"
            className={cn(
              run.status === "running" && "flex-1",
              "@3xl/main:ml-auto @3xl/main:flex-none"
            )}
          >
            <Link href="/analyses">All analyses</Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Phones and tablets: one card, switch with icon tabs. */}
      <Card className="gap-2 rounded-xl py-3 @3xl/main:hidden">
        <Tabs defaultValue="steps">
          <CardHeader className="px-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="steps" aria-label="Steps">
                <ListChecks className="size-4" aria-hidden />
                <span className="text-muted-foreground tabular-nums">
                  {run.stages.filter((s) => s.status === "completed").length}/8
                </span>
              </TabsTrigger>
              <TabsTrigger value="activity" aria-label="Activity">
                <History className="size-4" aria-hidden />
                <span className="text-muted-foreground tabular-nums">
                  {activity.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="px-2 pt-2">
            <TabsContent value="steps">{stepsList}</TabsContent>
            <TabsContent value="activity" className="px-2">
              {activityList}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Wide screens: steps and activity side by side. */}
      <div className="hidden items-start gap-6 @3xl/main:grid @3xl/main:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Steps</CardTitle>
          </CardHeader>
          <CardContent>{stepsList}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Activity</CardTitle>
            <CardDescription>What Jev has done so far.</CardDescription>
          </CardHeader>
          <CardContent>{activityList}</CardContent>
        </Card>
      </div>
    </div>
  )
}
