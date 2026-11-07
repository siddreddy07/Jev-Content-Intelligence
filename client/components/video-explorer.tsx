"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowRight,
  Check,
  LayoutGrid,
  Minus,
  TrendingDown,
  TrendingUp,
  Play,
  Search,
  SearchX,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react"

import {
  HOOKS,
  PERFORMANCE,
  type ClassifiedVideo,
  type HookId,
  type Performance,
} from "@/lib/snapshot"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useIsCompact } from "@/hooks/use-mobile"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

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

const sorts = {
  "views-desc": "Most views",
  "views-asc": "Fewest views",
  newest: "Newest first",
  oldest: "Oldest first",
} as const
type Sort = keyof typeof sorts
type PerformanceFilter = Performance | "all"
type HookFilter = HookId | "all"

const performanceTabs = [
  { value: "all" as PerformanceFilter, label: "All", icon: LayoutGrid },
  {
    value: "outperforming" as PerformanceFilter,
    label: "Outperforming",
    icon: TrendingUp,
  },
  { value: "on-par" as PerformanceFilter, label: "On par", icon: Minus },
  {
    value: "underperforming" as PerformanceFilter,
    label: "Under",
    icon: TrendingDown,
  },
]

const performanceDot: Record<Performance, string> = {
  outperforming: "bg-success",
  "on-par": "bg-muted-foreground/60",
  underperforming: "bg-warning",
}

const hookIds = Object.keys(HOOKS) as HookId[]
const sortKeys = Object.keys(sorts) as Sort[]
const hookOptions = [
  { value: "all" as HookFilter, label: "All hooks" },
  ...hookIds.map((id) => ({ value: id as HookFilter, label: HOOKS[id].name })),
]
const sortOptions = sortKeys.map((k) => ({ value: k, label: sorts[k] }))

/** Big number with a quieter unit, as in the design reference. */
function BigNumber({ text, className }: { text: string; className?: string }) {
  const [, value, unit] = /^([\d.,]+)(.*)$/.exec(text) ?? [, text, ""]
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

function DeltaPill({ views, average }: { views: number; average: number }) {
  const delta = Math.round((views / average - 1) * 100)
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
        delta >= 0 ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
      )}
    >
      {delta >= 0 ? "+" : ""}
      {delta}%
    </span>
  )
}

function PerformanceTag({ value }: { value: Performance }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span
        className={cn("size-2 rounded-full", performanceDot[value])}
        aria-hidden
      />
      {PERFORMANCE[value]}
    </span>
  )
}

/** Single-select options in a two-column grid; the chosen one is filled. */
function ChipGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-medium text-muted-foreground">
        {label}
      </legend>
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={2}
        value={value}
        onValueChange={(v) => v && onChange(v as T)}
        aria-label={label}
        className="grid w-full grid-cols-2"
      >
        {options.map((o) => (
          <ToggleGroupItem
            key={o.value}
            value={o.value}
            className="h-10 w-full justify-between gap-2 px-3 text-[13px] data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <span className="truncate">{o.label}</span>
            <Check
              className={cn(
                "size-4 shrink-0",
                value !== o.value && "invisible"
              )}
              aria-hidden
            />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </fieldset>
  )
}

export function VideoExplorer({
  videos,
  insight,
}: {
  videos: ClassifiedVideo[]
  insight: { name: string; lift: number; count: number; description: string }
}) {
  const [query, setQuery] = useState("")
  const [hook, setHook] = useState<HookFilter>("all")
  const [performance, setPerformance] = useState<PerformanceFilter>("all")
  const [sort, setSort] = useState<Sort>("views-desc")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const isCompact = useIsCompact()

  const average = useMemo(
    () => videos.reduce((n, v) => n + v.views, 0) / videos.length,
    [videos]
  )
  const top3 = useMemo(
    () => [...videos].sort((a, b) => b.views - a.views).slice(0, 3),
    [videos]
  )
  const selected = videos.find((v) => v.id === selectedId) ?? null

  // Search + hook narrow the set; tabs then split it, so tab counts stay accurate.
  const base = useMemo(() => {
    const q = query.trim().toLowerCase()
    return videos.filter(
      (x) =>
        (hook === "all" || x.hook === hook) &&
        (!q ||
          x.title.toLowerCase().includes(q) ||
          x.opening.toLowerCase().includes(q))
    )
  }, [videos, query, hook])

  const visible = useMemo(
    () =>
      base
        .filter((x) => performance === "all" || x.performance === performance)
        .sort((a, b) => {
          if (sort === "views-desc") return b.views - a.views
          if (sort === "views-asc") return a.views - b.views
          return sort === "newest"
            ? b.publishedAt.localeCompare(a.publishedAt)
            : a.publishedAt.localeCompare(b.publishedAt)
        }),
    [base, performance, sort]
  )

  const count = (p: PerformanceFilter) =>
    p === "all" ? base.length : base.filter((x) => x.performance === p).length
  const totalViews = visible.reduce((n, v) => n + v.views, 0)
  const tiles = [
    { label: "Videos", value: String(visible.length) },
    {
      label: "Average views",
      value: visible.length ? compact.format(totalViews / visible.length) : "–",
    },
    { label: "Total views", value: compact.format(totalViews) },
    {
      label: "Average length",
      value: visible.length
        ? `${Math.round(visible.reduce((n, v) => n + v.minutes, 0) / visible.length)}m`
        : "–",
    },
  ]
  const activeFilters =
    (hook !== "all" ? 1 : 0) + (sort !== "views-desc" ? 1 : 0)

  function reset() {
    setQuery("")
    setHook("all")
    setPerformance("all")
    setSort("views-desc")
  }

  const hookSelect = (
    <Select value={hook} onValueChange={(v) => setHook(v as HookFilter)}>
      <SelectTrigger className="w-40" aria-label="Filter by hook">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {hookOptions.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
  const sortSelect = (
    <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
      <SelectTrigger className="w-40" aria-label="Sort videos">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
  const maxViews = top3[0]?.views ?? 1

  return (
    <div className="space-y-4 @3xl/main:space-y-6">
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="font-heading text-xl font-medium @3xl/main:text-3xl">
          Video explorer
        </h1>
        <p className="text-xs text-muted-foreground @3xl/main:text-sm">
          {videos.length} videos
        </p>
      </header>

      {/* Leaderboard + AI insight. */}
      <section className="grid grid-cols-1 gap-3 @3xl/main:gap-4 @4xl/main:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-2 @3xl/main:hidden">
          <h2 className="text-sm font-medium">Top videos by views</h2>
          <ol className="grid grid-cols-3 gap-2 @xl/main:gap-3">
            {top3.map((v, i) => (
              <li key={v.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  aria-label={`Open details for ${v.title}`}
                  className="flex aspect-square w-full min-w-0 flex-col justify-between rounded-md border bg-card p-2.5 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring @xl/main:p-4"
                >
                  <span className="flex items-center justify-between gap-1">
                    <span className="flex size-3 items-center justify-center rounded-lg bg-accent text-xs font-medium text-accent-foreground tabular-nums">
                      {i + 1}
                    </span>
                    <DeltaPill views={v.views} average={average} />
                  </span>
                  <span className="min-w-0 space-y-1">
                    <span className="block font-heading text-2xl leading-none font-medium tabular-nums @xl/main:text-4xl">
                      {compact.format(v.views)}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      views
                    </span>
                  </span>
                  <span className="block truncate text-xs @xl/main:text-sm">
                    {v.title}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <Card className="hidden min-w-0 gap-2 rounded-2xl py-4 @3xl/main:flex">
          <CardHeader className="px-4">
            <h2 className="text-sm font-medium @3xl/main:text-base">
              Top videos by views
            </h2>
          </CardHeader>
          <CardContent className="px-2 @3xl/main:px-3">
            <ItemGroup>
              {top3.map((v, i) => (
                <Item
                  key={v.id}
                  size="sm"
                  asChild
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(v.id)}
                    aria-label={`Open details for ${v.title}`}
                    className="w-full text-left"
                  >
                    <ItemMedia variant="icon" className="size-7 tabular-nums">
                      {i + 1}
                    </ItemMedia>
                    <ItemContent className="min-w-0 gap-1.5">
                      <ItemTitle className="w-full truncate text-[13px] @3xl/main:text-sm">
                        {v.title}
                      </ItemTitle>
                      <Progress
                        value={(v.views / maxViews) * 100}
                        aria-label={`${compact.format(v.views)} views`}
                        className="h-1"
                      />
                    </ItemContent>
                    <ItemActions className="flex-col items-end gap-0.5">
                      <span className="font-heading text-base font-medium tabular-nums @3xl/main:text-lg">
                        {compact.format(v.views)}
                      </span>
                      <DeltaPill views={v.views} average={average} />
                    </ItemActions>
                  </button>
                </Item>
              ))}
            </ItemGroup>
          </CardContent>
        </Card>

        <Card
          className="gap-3 rounded-xl border border-primary/25 bg-card py-4 @3xl/main:rounded-2xl"
          style={{
            backgroundImage:
              "radial-gradient(120% 80% at 100% 100%, oklch(0.5 0.16 292 / 0.45), transparent 62%)",
          }}
        >
          <CardHeader className="space-y-2 px-4">
            <Badge className="w-fit gap-1.5 border-ai/30 bg-ai-soft text-ai">
              <Sparkles className="size-3" aria-hidden />
              AI interpretation
            </Badge>
            <p className="font-heading text-base leading-snug @3xl/main:text-lg">
              {insight.name} openings earn {insight.lift}% more than average
            </p>
            <p className="line-clamp-2 text-xs text-muted-foreground @3xl/main:text-sm">
              {insight.description} Seen in {insight.count} of these videos.
            </p>
          </CardHeader>
          <CardContent className="flex gap-2 px-4 @4xl/main:flex-col">
            <Button asChild size="sm" className="flex-1 p-2">
              <Link href="/analyses/an_02/snapshot?name=Dan%20Reyes">
                Full snapshot
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 p-2 bg-background/30"
              onClick={() => {
                setHook("result-first")
                setPerformance("all")
              }}
            >
              Show only these
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Toolbar. */}
      <section aria-labelledby="all-videos" className="space-y-3">
        <h2 id="all-videos" className="sr-only">
          All videos
        </h2>
        <div className="flex items-center gap-2">
          <InputGroup className="min-w-0 flex-1 bg-card @3xl/main:max-w-xs @3xl/main:flex-none">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos"
              aria-label="Search videos"
            />
          </InputGroup>
          <div className="ml-auto hidden items-center gap-2 @3xl/main:flex">
            {hookSelect}
            {sortSelect}
          </div>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" className="gap-2 @3xl/main:hidden">
                <SlidersHorizontal className="size-4" />
                Filters
                {activeFilters > 0 && (
                  <Badge className="h-5 min-w-5 rounded-full px-1.5 tabular-nums">
                    {activeFilters}
                  </Badge>
                )}
              </Button>
            </DrawerTrigger>
            <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[85dvh]">
              <DrawerHeader className="text-left">
                <DrawerTitle>Filters and sort</DrawerTitle>
                <DrawerDescription>
                  {visible.length} of {videos.length} videos match.
                </DrawerDescription>
              </DrawerHeader>
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4">
                <ChipGroup
                  label="Hook"
                  value={hook}
                  onChange={setHook}
                  options={hookOptions}
                />
                <ChipGroup
                  label="Sort by"
                  value={sort}
                  onChange={setSort}
                  options={sortOptions}
                />
              </div>
              <DrawerFooter className="flex-row">
                <Button variant="outline" className="flex-1" onClick={reset}>
                  Reset
                </Button>
                <DrawerClose asChild>
                  <Button className="flex-1">
                    Show {visible.length} videos
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        <Tabs
          value={performance}
          onValueChange={(v) => setPerformance(v as PerformanceFilter)}
        >
          <TabsList className="w-full @3xl/main:w-fit">
            {performanceTabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} aria-label={label}>
                <Icon className="size-4 @3xl/main:hidden" aria-hidden />
                <span className="hidden @3xl/main:inline">{label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {count(value)}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <dl className="grid grid-cols-2 divide-x divide-y rounded-xl border bg-card @3xl/main:grid-cols-4 @3xl/main:divide-y-0 @3xl/main:rounded-2xl">
          {tiles.map((t) => (
            <div
              key={t.label}
              className="px-3 py-2 @3xl/main:px-4 @3xl/main:py-3"
            >
              <dt className="text-[11px] text-muted-foreground @3xl/main:text-xs">
                {t.label}
              </dt>
              <dd>
                <BigNumber
                  text={t.value}
                  className="text-lg @3xl/main:text-2xl"
                />
              </dd>
            </div>
          ))}
        </dl>

        <p role="status" className="sr-only">
          Showing {visible.length} of {videos.length} videos
        </p>

        {visible.length === 0 ? (
          <Empty className="rounded-xl border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>No videos match</EmptyTitle>
              <EmptyDescription>
                Try a different search, or clear the filters.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" variant="outline" onClick={reset}>
                Clear filters
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            {/* Phones and tablets: compact rows. */}
            <Card className="gap-0 rounded-xl py-0 @3xl/main:hidden">
              <ItemGroup>
                {visible.map((v) => (
                  <Item
                    key={v.id}
                    size="sm"
                    asChild
                    className="cursor-pointer rounded-none border-0 border-b last:border-b-0 hover:bg-muted/50"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(v.id)}
                      className="w-full text-left"
                    >
                      <ItemMedia
                        variant="image"
                        className="relative aspect-video h-auto w-16 @xl/main:w-24"
                      >
                        <Play
                          className="size-3.5 text-muted-foreground"
                          aria-hidden
                        />
                        <span className="absolute right-0.5 bottom-0.5 rounded-sm bg-background/80 px-1 text-[10px] tabular-nums">
                          {v.minutes}m
                        </span>
                      </ItemMedia>
                      <ItemContent className="min-w-0 gap-1">
                        <ItemTitle className="block w-full truncate text-[13px]">
                          {v.title}
                        </ItemTitle>
                        <ItemDescription className="flex flex-wrap items-center gap-x-2 text-[11px]">
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              performanceDot[v.performance]
                            )}
                            aria-hidden
                          />
                          <span className="sr-only">
                            {PERFORMANCE[v.performance]}
                          </span>
                          <span>{date.format(new Date(v.publishedAt))}</span>
                          <span>{HOOKS[v.hook].name}</span>
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions className="flex-col items-end gap-0">
                        <span className="font-heading text-sm font-medium tabular-nums">
                          {compact.format(v.views)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          views
                        </span>
                      </ItemActions>
                    </button>
                  </Item>
                ))}
              </ItemGroup>
            </Card>

            {/* Wide content areas: a table. */}
            <Card className="hidden gap-0 overflow-hidden rounded-2xl py-0 @3xl/main:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="pl-4">Video</TableHead>
                    <TableHead>Hook</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="pr-4 text-right">Published</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((v) => (
                    <TableRow
                      key={v.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`Open details for ${v.title}`}
                      onClick={() => setSelectedId(v.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          setSelectedId(v.id)
                        }
                      }}
                      className="cursor-pointer outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <span className="relative flex aspect-video w-20 shrink-0 items-center justify-center rounded-md bg-muted">
                            <Play
                              className="size-3.5 text-muted-foreground"
                              aria-hidden
                            />
                            <span className="absolute right-1 bottom-1 rounded-sm bg-background/80 px-1 text-[10px] tabular-nums">
                              {v.minutes}m
                            </span>
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {v.title}
                            </p>
                            <p className="max-w-sm truncate text-xs text-muted-foreground">
                              &ldquo;{v.opening}&rdquo;
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{HOOKS[v.hook].name}</Badge>
                      </TableCell>
                      <TableCell>
                        <PerformanceTag value={v.performance} />
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {compact.format(v.views)}
                      </TableCell>
                      <TableCell className="pr-4 text-right text-muted-foreground tabular-nums">
                        {date.format(new Date(v.publishedAt))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </section>

      {/* Detail for one video: bottom drawer on phones and tablets. */}
      <Drawer
        open={selected !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
        direction={isCompact ? "bottom" : "right"}
      >
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[85dvh] data-[vaul-drawer-direction=right]:sm:max-w-sm">
          {selected && (
            <>
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-base leading-snug">
                  {selected.title}
                </DrawerTitle>
                <DrawerDescription>
                  {selected.group === "top" ? "Top 10" : "Latest 10"} ·{" "}
                  {date.format(new Date(selected.publishedAt))}
                </DrawerDescription>
              </DrawerHeader>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6">
                <dl className="grid grid-cols-3 gap-2">
                  {[
                    ["Views", compact.format(selected.views)],
                    [
                      "vs average",
                      `${selected.views >= average ? "+" : ""}${Math.round((selected.views / average - 1) * 100)}%`,
                    ],
                    ["Length", `${selected.minutes} min`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border p-3">
                      <dt className="text-[11px] text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="font-heading text-lg font-medium tabular-nums">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="space-y-1.5 rounded-xl border p-3">
                  <p className="text-[11px] text-muted-foreground">
                    Opening line
                  </p>
                  <blockquote className="text-sm italic">
                    &ldquo;{selected.opening}&rdquo;
                  </blockquote>
                </div>

                <div className="space-y-1.5 rounded-xl border border-ai/30 bg-ai-soft/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge className="gap-1.5 border-ai/30 bg-ai-soft text-ai">
                      <Sparkles className="size-3" aria-hidden />
                      {HOOKS[selected.hook].name}
                    </Badge>
                    <PerformanceTag value={selected.performance} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {HOOKS[selected.hook].description}
                  </p>
                </div>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}
