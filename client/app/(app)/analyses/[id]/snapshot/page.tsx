import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Play, Ruler, Sparkles } from "lucide-react"

import { getAnalysis } from "@/lib/data"
import {
  getSnapshot,
  HOOKS,
  type Confidence,
  type Group,
  type Interpretation,
  type SnapshotVideo,
} from "@/lib/snapshot"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Creator snapshot" }

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})
const date = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})
const lift = (n: number) => `${n > 0 ? "+" : ""}${n}%`
const groupLabel: Record<Group, string> = { top: "Top 10", latest: "Latest 10" }

/* ---------- Provenance: measured data vs AI interpretation ---------- */

function Source({ kind }: { kind: "measured" | "ai" }) {
  return kind === "measured" ? (
    <Badge variant="outline" className="gap-1.5 text-foreground">
      <Ruler className="size-3" aria-hidden />
      Measured
    </Badge>
  ) : (
    <Badge className="gap-1.5 border-ai/30 bg-ai-soft text-ai">
      <Sparkles className="size-3" aria-hidden />
      AI interpretation
    </Badge>
  )
}

function Section({
  id,
  title,
  source,
  note,
  children,
}: {
  id: string
  title: string
  source: React.ReactNode
  note?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-h`}
      className="scroll-mt-20 space-y-5"
    >
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id={`${id}-h`} className="text-xl font-semibold">
            {title}
          </h2>
          {source}
        </div>
        {note && (
          <p className="max-w-2xl text-sm text-muted-foreground">{note}</p>
        )}
      </div>
      {children}
    </section>
  )
}

/** Three-step confidence meter. Text carries the meaning; the bars repeat it. */
function ConfidenceMeter({
  level,
  basis,
}: {
  level: Confidence
  basis: string
}) {
  const filled = { high: 3, medium: 2, low: 1 }[level]
  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="flex gap-0.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "h-3 w-1.5 rounded-[1px]",
              i < filled ? "bg-foreground" : "bg-border"
            )}
          />
        ))}
      </span>
      <span className="font-medium text-foreground capitalize">
        {level} confidence
      </span>
      <span>· {basis}</span>
    </p>
  )
}

/** Ten squares, `count` filled: how many of a group's 10 videos match. */
function Strip({
  count,
  tone,
  label,
}: {
  count: number
  tone: "primary" | "muted"
  label: string
}) {
  return (
    <div
      role="img"
      aria-label={`${label}: ${count} of 10`}
      className="flex gap-0.5"
    >
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-3 w-3 rounded-[2px]",
            i < count
              ? tone === "primary"
                ? "bg-primary"
                : "bg-muted-foreground"
              : "bg-border"
          )}
        />
      ))}
    </div>
  )
}

function ViewsColumn({
  title,
  group,
  videos,
  average,
  max,
}: {
  title: string
  group: Group
  videos: SnapshotVideo[]
  average: number
  max: number
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3 border-b pb-2">
        <h3 className="flex items-center gap-2 font-sans text-base font-medium">
          <span
            className={cn(
              "size-2.5 rounded-[2px]",
              group === "top" ? "bg-primary" : "bg-muted-foreground"
            )}
            aria-hidden
          />
          {title}
        </h3>
        <p className="text-sm text-muted-foreground tabular-nums">
          Average{" "}
          <span className="font-medium text-foreground">
            {compact.format(average)}
          </span>
        </p>
      </div>
      <ol className="space-y-3">
        {videos.map((x) => (
          <li key={x.id} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">{x.title}</span>
              <span className="font-medium tabular-nums">
                {compact.format(x.views)}
              </span>
            </div>
            <div className="h-2" aria-hidden>
              <div
                className={cn(
                  "h-full rounded-r-[4px]",
                  group === "top" ? "bg-primary" : "bg-muted-foreground"
                )}
                style={{ width: `${(x.views / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function EvidenceLinks({ ids, all }: { ids: string[]; all: SnapshotVideo[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {ids.map((id) => {
        const x = all.find((y) => y.id === id)!
        return (
          <li key={id}>
            <a
              href={`#v-${id}`}
              className="inline-block max-w-56 truncate rounded-md border bg-background px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {x.title}
            </a>
          </li>
        )
      })}
    </ul>
  )
}

/** AI-written findings, visually separated from measured data. */
function Findings({
  items,
  all,
}: {
  items: Interpretation[]
  all: SnapshotVideo[]
}) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <li
          key={item.title}
          className="space-y-3 rounded-lg border-l-2 border-ai bg-ai-soft/60 p-4"
        >
          <h3 className="font-sans text-base font-medium">{item.title}</h3>
          <p className="text-sm text-muted-foreground">{item.detail}</p>
          <ConfidenceMeter level={item.confidence} basis={item.basis} />
          <EvidenceLinks ids={item.evidence} all={all} />
        </li>
      ))}
    </ul>
  )
}

/* ---------- Page ---------- */

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

  const evidenceIds = [
    ...new Set(
      [...s.blindSpots, ...s.contentPatterns].flatMap((i) => i.evidence)
    ),
  ]
  const evidence = s.videos.filter((x) => evidenceIds.includes(x.id))

  const kpis = [
    {
      label: "Top 10 average views",
      value: compact.format(s.comparison.topAvg),
    },
    {
      label: "Latest 10 average views",
      value: compact.format(s.comparison.latestAvg),
    },
    {
      label: "Best vs recent",
      value: lift(s.comparison.lift),
      hint: "Top 10 earn this much more than the latest 10",
    },
    {
      label: "Recent videos using winning openings",
      value: `${s.alignment.score}%`,
      hint: "Compared with the top 10",
    },
  ]

  const nav = [
    ["comparison", "Comparison"],
    ["hooks", "Openings that work"],
    ["alignment", "Recent vs best"],
    ["content", "Content patterns"],
    ["blind-spots", "Blind spots"],
    ["evidence", "Evidence"],
  ]

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/analyses/${id}`}>
            <ArrowLeft className="size-4" />
            Analysis progress
          </Link>
        </Button>

        <header className="space-y-3">
          <h1 className="text-3xl font-semibold md:text-4xl">{creator}</h1>
          <p className="text-muted-foreground">
            Snapshot of {s.transcribed} videos, generated{" "}
            {date.format(new Date(s.generatedAt))}
            {analysis && ` · ${analysis.creator.handle}`}
          </p>
          <p className="max-w-2xl text-sm text-muted-foreground">
            A hook is what a creator says in the first seconds of a video. This
            page shows which hooks earned the most views.
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <Source kind="measured" /> Calculated from YouTube data and
            transcripts.
            <Source kind="ai" /> Written by AI from that data. Check it against
            the evidence.
          </p>
        </header>

        <dl className="grid grid-cols-2 gap-y-6 border-y py-6 lg:grid-cols-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="space-y-1 lg:border-l lg:pl-6 lg:first:border-l-0 lg:first:pl-0"
            >
              <dt className="text-sm text-muted-foreground">{k.label}</dt>
              <dd className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
                {k.value}
              </dd>
              {k.hint && (
                <p className="text-xs text-muted-foreground">{k.hint}</p>
              )}
            </div>
          ))}
        </dl>

        <div className="space-y-2 rounded-lg border-l-2 border-ai bg-ai-soft/60 p-4">
          <Source kind="ai" />
          <p className="max-w-3xl">{s.aiSummary}</p>
        </div>

        <nav aria-label="Snapshot sections">
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {nav.map(([href, label]) => (
              <li key={href}>
                <a
                  href={`#${href}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <Section
        id="comparison"
        title="Top 10 vs latest 10"
        source={<Source kind="measured" />}
        note={`The ten most-viewed videos average ${s.comparison.topMinutes} minutes. The ten latest average ${s.comparison.latestMinutes}. Both columns share one scale.`}
      >
        <div className="grid gap-10 md:grid-cols-2 md:gap-12">
          <ViewsColumn
            title="Top 10 by views"
            group="top"
            videos={s.top}
            average={s.comparison.topAvg}
            max={s.maxViews}
          />
          <ViewsColumn
            title="Latest 10 uploads"
            group="latest"
            videos={s.latest}
            average={s.comparison.latestAvg}
            max={s.maxViews}
          />
        </div>
      </Section>

      <Section
        id="hooks"
        title="Openings that work"
        source={<Source kind="measured" />}
        note="Counts and views are measured. Each video's hook category is assigned by AI from its opening line. Lift compares a pattern's average views with the channel average."
      >
        <ul className="divide-y border-y">
          {s.patterns.map((p) => (
            <li
              key={p.id}
              className="grid gap-4 py-5 md:grid-cols-[minmax(0,1fr)_16rem] md:gap-8"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-sans text-base font-medium">{p.name}</h3>
                  {p.lift > 0 ? (
                    <Badge
                      variant="outline"
                      className="border-success/40 text-success"
                    >
                      Winning
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Below average
                    </Badge>
                  )}
                </div>
                <p className="flex gap-2 text-sm text-muted-foreground">
                  <Sparkles
                    className="mt-0.5 size-3.5 shrink-0 text-ai"
                    aria-label="AI-written"
                  />
                  {p.description}
                </p>
                <blockquote className="border-l-2 pl-3 text-sm italic">
                  &ldquo;{p.example}&rdquo;
                </blockquote>
                <ConfidenceMeter
                  level={p.confidence}
                  basis={`${p.count} videos`}
                />
              </div>

              <div className="space-y-3">
                <p className="tabular-nums">
                  <span
                    className={cn(
                      "font-heading text-2xl font-semibold",
                      p.lift < 0 && "text-muted-foreground"
                    )}
                  >
                    {lift(p.lift)}
                  </span>{" "}
                  <span className="text-sm text-muted-foreground">
                    {compact.format(p.avgViews)} avg views
                  </span>
                </p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between gap-3">
                    Top 10
                    <Strip
                      count={p.topCount}
                      tone="primary"
                      label={`${p.name} in top 10`}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    Latest 10
                    <Strip
                      count={p.latestCount}
                      tone="muted"
                      label={`${p.name} in latest 10`}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="alignment"
        title="Are recent videos still using them?"
        source={<Source kind="measured" />}
        note="How often each group opens with a winning pattern."
      >
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            {(
              [
                ["Top 10", s.alignment.topWinning, "primary"],
                ["Latest 10", s.alignment.latestWinning, "muted"],
              ] as const
            ).map(([label, count, tone]) => (
              <div key={label} className="space-y-1.5">
                <p className="flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="font-medium tabular-nums">
                    {count} of 10 open with a winning pattern
                  </span>
                </p>
                <Strip
                  count={count}
                  tone={tone}
                  label={`${label} winning openings`}
                />
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              Winning patterns:{" "}
              {s.winningIds
                .map((w) => HOOKS[w as keyof typeof HOOKS].name)
                .join(", ")}
              .
            </p>
          </div>
          <div className="space-y-2 rounded-lg border-l-2 border-ai bg-ai-soft/60 p-4">
            <Source kind="ai" />
            <p className="text-sm">
              The latest uploads use winning openings at {s.alignment.score}% of
              the rate of the top 10. Most of the gap is greetings and open
              questions replacing result-first openings.
            </p>
            <ConfidenceMeter level="high" basis="20 of 20 videos transcribed" />
          </div>
        </div>
      </Section>

      <Section
        id="content"
        title="Content patterns"
        source={<Source kind="ai" />}
        note="Themes the AI found across titles, topics and openings. Confidence reflects how many videos support each one."
      >
        <Findings items={s.contentPatterns} all={s.videos} />
      </Section>

      <Section
        id="blind-spots"
        title="Blind spots"
        source={<Source kind="ai" />}
        note="Places where recent videos drift from what has worked, or where the data is too thin to be sure."
      >
        <Findings items={s.blindSpots} all={s.videos} />
      </Section>

      <Section
        id="evidence"
        title="Supporting videos"
        source={<Source kind="measured" />}
        note="Videos cited by the findings above, with their opening lines from the transcript."
      >
        <ul className="divide-y border-y">
          {evidence.map((x) => (
            <li
              key={x.id}
              id={`v-${x.id}`}
              className="flex scroll-mt-20 gap-4 py-4"
            >
              <div className="relative flex aspect-video w-28 shrink-0 items-center justify-center self-start rounded-md bg-muted sm:w-40">
                <Play className="size-5 text-muted-foreground" aria-hidden />
                <span className="absolute right-1.5 bottom-1.5 rounded-sm bg-foreground/80 px-1 text-[11px] text-background tabular-nums">
                  {x.minutes} min
                </span>
              </div>
              <div className="min-w-0 space-y-2">
                <h3 className="font-sans text-base leading-snug font-medium">
                  {x.title}
                </h3>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span>{groupLabel[x.group]}</span>
                  <span className="tabular-nums">
                    {compact.format(x.views)} views
                  </span>
                  <span>{date.format(new Date(x.publishedAt))}</span>
                  <Badge variant="outline">{HOOKS[x.hook].name}</Badge>
                </p>
                <blockquote className="border-l-2 pl-3 text-sm italic">
                  &ldquo;{x.opening}&rdquo;
                </blockquote>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
