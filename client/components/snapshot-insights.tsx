"use client"

import { useState } from "react"
import { ChevronRight, Sparkles, Video } from "lucide-react"

import { useIsCompact } from "@/hooks/use-mobile"
import {
  type Confidence,
  type Group,
  type Interpretation,
  type SnapshotVideo,
} from "@/lib/snapshot"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})

type Panel =
  { kind: "finding"; finding: Interpretation } | { kind: "all"; ids: string[] }

const confidenceBars: Record<Confidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

/** Three small bars plus the word. Text carries the meaning. */
function ConfidencePill({ level }: { level: Confidence }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs">
      <span className="flex gap-0.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "h-2.5 w-1 rounded-[1px]",
              i < confidenceBars[level] ? "bg-foreground" : "bg-border"
            )}
          />
        ))}
      </span>
      <span className="capitalize">{level} confidence</span>
    </span>
  )
}

function Delta({ views, average }: { views: number; average: number }) {
  const delta = Math.round((views / average - 1) * 100)
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
        delta >= 0 ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
      )}
    >
      {delta >= 0 ? "+" : ""}
      {delta}%
    </span>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/40 p-3">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="font-heading text-lg font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function VideoRow({
  video,
  average,
  max,
}: {
  video: SnapshotVideo
  average: number
  max: number
}) {
  return (
    <div className="space-y-1.5 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[13px]">{video.title}</p>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-heading text-sm font-medium tabular-nums">
            {compact.format(video.views)}
          </span>
          <Delta views={video.views} average={average} />
        </div>
      </div>
      <Progress
        value={(video.views / max) * 100}
        aria-label={`${compact.format(video.views)} views`}
        className="h-1"
      />
    </div>
  )
}

function FindingList({
  items,
  onOpen,
}: {
  items: Interpretation[]
  onOpen: (f: Interpretation) => void
}) {
  return (
    <ul className="divide-y">
      {items.map((f) => (
        <li key={f.title}>
          <button
            type="button"
            onClick={() => onOpen(f)}
            className="flex w-full items-center gap-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="min-w-0 flex-1 text-[13px] @3xl/main:text-sm">
              {f.title}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground capitalize">
              {f.confidence}
            </span>
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </button>
        </li>
      ))}
    </ul>
  )
}

/**
 * The AI interpretation, kept short. Each point and the "Supporting videos"
 * button open a drawer of metrics and evidence.
 */
export function SnapshotInsights({
  summary,
  patterns,
  blindSpots,
  videos,
}: {
  summary: string
  patterns: Interpretation[]
  blindSpots: Interpretation[]
  videos: SnapshotVideo[]
}) {
  const [panel, setPanel] = useState<Panel | null>(null)
  const [group, setGroup] = useState<Group | "all">("all")
  const isMobile = useIsCompact()

  const average = videos.reduce((n, v) => n + v.views, 0) / videos.length
  const max = Math.max(...videos.map((v) => v.views))
  const allCited = [
    ...new Set([...patterns, ...blindSpots].flatMap((f) => f.evidence)),
  ]

  const ids =
    panel?.kind === "finding" ? panel.finding.evidence : (panel?.ids ?? [])
  const cited = ids.flatMap((id) => videos.find((v) => v.id === id) ?? [])
  const shown =
    panel?.kind === "all" && group !== "all"
      ? cited.filter((v) => v.group === group)
      : cited
  const citedAvg = cited.length
    ? cited.reduce((n, v) => n + v.views, 0) / cited.length
    : 0
  const gap = Math.round((citedAvg / average - 1) * 100)

  return (
    <>
      <Card className="gap-2 rounded-xl border-ai/30 bg-ai-soft/40 py-3 @3xl/main:gap-4 @3xl/main:rounded-2xl @3xl/main:py-4">
        <CardHeader className="space-y-2 @3xl/main:space-y-3">
          <Badge className="w-fit gap-1.5 border-ai/30 bg-ai-soft text-ai">
            <Sparkles className="size-3" aria-hidden />
            AI interpretation
          </Badge>
          <p className="max-w-prose text-[13px] leading-relaxed @3xl/main:text-sm">
            {summary}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Tabs defaultValue="blind-spots">
            <TabsList variant="line">
              <TabsTrigger value="blind-spots">Blind spots</TabsTrigger>
              <TabsTrigger value="patterns">Patterns</TabsTrigger>
            </TabsList>
            <TabsContent value="blind-spots">
              <FindingList
                items={blindSpots}
                onOpen={(finding) => setPanel({ kind: "finding", finding })}
              />
            </TabsContent>
            <TabsContent value="patterns">
              <FindingList
                items={patterns}
                onOpen={(finding) => setPanel({ kind: "finding", finding })}
              />
            </TabsContent>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 @3xl/main:w-auto"
            onClick={() => {
              setGroup("all")
              setPanel({ kind: "all", ids: allCited })
            }}
          >
            <Video className="size-4" />
            Supporting videos
            <span className="text-muted-foreground tabular-nums">
              {allCited.length}
            </span>
          </Button>
        </CardContent>
      </Card>

      <Drawer
        open={panel !== null}
        onOpenChange={(open) => !open && setPanel(null)}
        direction={isMobile ? "bottom" : "right"}
      >
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[85dvh] data-[vaul-drawer-direction=right]:sm:max-w-md">
          {panel && (
            <>
              <DrawerHeader className="gap-2 text-left">
                {panel.kind === "finding" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <ConfidencePill level={panel.finding.confidence} />
                  </div>
                ) : null}
                <DrawerTitle className="font-heading text-base leading-snug">
                  {panel.kind === "finding"
                    ? panel.finding.title
                    : "Supporting videos"}
                </DrawerTitle>
                <DrawerDescription className="text-xs">
                  {panel.kind === "finding"
                    ? panel.finding.detail
                    : "The videos behind the AI points."}
                </DrawerDescription>
              </DrawerHeader>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6">
                <dl className="grid grid-cols-3 gap-2">
                  <Stat label="Videos" value={String(cited.length)} />
                  <Stat label="Avg views" value={compact.format(citedAvg)} />
                  <Stat
                    label="vs channel"
                    value={`${gap >= 0 ? "+" : ""}${gap}%`}
                  />
                </dl>

                {panel.kind === "all" && (
                  <Tabs
                    value={group}
                    onValueChange={(v) => setGroup(v as Group | "all")}
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="top">Top 10</TabsTrigger>
                      <TabsTrigger value="latest">Latest 10</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}

                <ul className="divide-y">
                  {shown.map((v) => (
                    <li key={v.id}>
                      <VideoRow video={v} average={average} max={max} />
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}
