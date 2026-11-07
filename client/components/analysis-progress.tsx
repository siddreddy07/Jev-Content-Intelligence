"use client"

import Link from "next/link"
import { useEffect, useState, useSyncExternalStore } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  RotateCcw,
  XCircle,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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

function StageIcon({ status }: { status: StageStatus }) {
  const label = {
    pending: "Pending",
    running: "Running",
    completed: "Completed",
    failed: "Failed",
  }[status]
  return (
    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
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
      <span className="sr-only">{label}</span>
    </span>
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

  return (
    <div className="max-w-3xl space-y-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/">
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>
      </Button>

      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold">{name}</h1>
          {saved && (
            <Badge variant="outline" className="gap-1.5">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  run.status === "running" &&
                    "bg-primary motion-safe:animate-pulse",
                  run.status === "completed" && "bg-success",
                  run.status === "failed" && "bg-destructive"
                )}
                aria-hidden
              />
              {
                {
                  running: "Running",
                  completed: "Completed",
                  failed: "Failed",
                }[run.status]
              }
            </Badge>
          )}
        </div>
        {handle && <p className="text-muted-foreground">{handle}</p>}
      </header>

      {!saved ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <section aria-label="Overall progress" className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <p aria-live="polite" className="font-medium">
                {run.status === "completed"
                  ? "All 8 stages complete"
                  : run.status === "failed"
                    ? `Stopped at stage ${run.current! + 1} of 8: ${current!.title}`
                    : `Stage ${run.current! + 1} of 8: ${current!.title}`}
              </p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {percent}%
                {run.status === "running" &&
                  ` · ${formatElapsed(elapsed)} elapsed`}
                {run.status === "completed" &&
                  ` · finished in ${formatElapsed(TOTAL_SECONDS)}`}
              </p>
            </div>
            <Progress value={percent} aria-label="Overall analysis progress" />
          </section>

          {run.status === "completed" && (
            <Alert>
              <CheckCircle2 className="text-success" />
              <AlertTitle>Snapshot ready</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                Hook patterns, performance lift and blind spots are ready to
                review.
                <Button asChild size="sm">
                  <Link href={`/analyses/${id}/snapshot`}>
                    View creator snapshot
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <ol className="divide-y border-y">
            {run.stages.map((stage, i) => (
              <li
                key={stage.title}
                aria-current={stage.status === "running" ? "step" : undefined}
                className={cn(
                  "flex gap-4 px-2 py-4 sm:px-4",
                  stage.status === "running" && "bg-accent/50"
                )}
              >
                <StageIcon status={stage.status} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <h2
                      className={cn(
                        "font-sans text-[15px] font-medium",
                        stage.status === "pending" && "text-muted-foreground"
                      )}
                    >
                      <span className="mr-2 text-sm font-normal text-muted-foreground tabular-nums">
                        {i + 1}
                      </span>
                      {stage.title}
                    </h2>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {stage.detail}
                      {stage.detail && stage.seconds !== undefined && " · "}
                      {stage.seconds !== undefined && `${stage.seconds}s`}
                    </p>
                  </div>

                  {stage.status !== "failed" && (
                    <p className="text-sm text-muted-foreground">
                      {stage.description}
                    </p>
                  )}

                  {stage.status === "running" && (
                    <Progress
                      value={Math.round(stage.progress! * 100)}
                      aria-label={`${stage.title} progress`}
                      className="h-1"
                    />
                  )}

                  {stage.status === "failed" && (
                    <Alert variant="destructive">
                      <XCircle />
                      <AlertTitle>{stage.title} failed</AlertTitle>
                      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                        {failureReason ?? FAIL_MESSAGE} Earlier stages are
                        saved, so a retry resumes from here.
                        <Button size="sm" variant="outline" onClick={retry}>
                          <RotateCcw className="size-4" />
                          Retry stage
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}
