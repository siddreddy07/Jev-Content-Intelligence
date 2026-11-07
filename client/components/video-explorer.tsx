"use client"

import { useMemo, useState } from "react"
import { Play, Search, SearchX, SlidersHorizontal } from "lucide-react"

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

const performanceDot: Record<Performance, string> = {
  outperforming: "bg-success",
  "on-par": "bg-muted-foreground/60",
  underperforming: "bg-warning",
}

const hookIds = Object.keys(HOOKS) as HookId[]
const sortKeys = Object.keys(sorts) as Sort[]

/** Single-select chips: easy to tap on a phone, used inside the drawer. */
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
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={2}
        value={value}
        onValueChange={(v) => v && onChange(v as T)}
        aria-label={label}
        className="flex-wrap"
      >
        {options.map((o) => (
          <ToggleGroupItem key={o.value} value={o.value} className="h-9 px-3">
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

export function VideoExplorer({ videos }: { videos: ClassifiedVideo[] }) {
  const [query, setQuery] = useState("")
  const [hook, setHook] = useState<HookFilter>("all")
  const [performance, setPerformance] = useState<PerformanceFilter>("all")
  const [sort, setSort] = useState<Sort>("views-desc")

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
  const activeFilters =
    (hook !== "all" ? 1 : 0) + (sort !== "views-desc" ? 1 : 0)

  function reset() {
    setQuery("")
    setHook("all")
    setPerformance("all")
    setSort("views-desc")
  }

  const hookOptions = [
    { value: "all" as HookFilter, label: "All hooks" },
    ...hookIds.map((id) => ({
      value: id as HookFilter,
      label: HOOKS[id].name,
    })),
  ]
  const sortOptions = sortKeys.map((k) => ({ value: k, label: sorts[k] }))

  return (
    <div className="space-y-5">
      {/* Search always; hook + sort inline on desktop, in a drawer below that. */}
      <div className="sticky top-14 z-10 -mx-4 space-y-3 bg-background/90 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex gap-2">
          <InputGroup className="h-10 flex-1 bg-card">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles and opening lines"
              aria-label="Search videos"
            />
          </InputGroup>

          <div className="hidden gap-2 lg:flex">
            <Select
              value={hook}
              onValueChange={(v) => setHook(v as HookFilter)}
            >
              <SelectTrigger
                className="h-10 w-40"
                aria-label="Filter by hook category"
              >
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
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="h-10 w-40" aria-label="Sort videos">
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
          </div>

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" className="h-10 gap-2 lg:hidden">
                <SlidersHorizontal className="size-4" />
                <span className="hidden sm:inline">Filters</span>
                <span className="sr-only sm:hidden">Filters</span>
                {activeFilters > 0 && (
                  <Badge className="h-5 min-w-5 rounded-full px-1.5 tabular-nums">
                    {activeFilters}
                  </Badge>
                )}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader className="text-left">
                <DrawerTitle>Filters and sort</DrawerTitle>
                <DrawerDescription>
                  {visible.length} of {videos.length} videos match.
                </DrawerDescription>
              </DrawerHeader>
              <div className="space-y-6 overflow-y-auto px-4 pb-2">
                <ChipGroup
                  label="Hook category"
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

        {/* Performance tabs scroll sideways on narrow screens instead of wrapping. */}
        <Tabs
          value={performance}
          onValueChange={(v) => setPerformance(v as PerformanceFilter)}
        >
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <TabsList variant="line" className="w-max">
              {(
                ["all", "outperforming", "on-par", "underperforming"] as const
              ).map((p) => (
                <TabsTrigger key={p} value={p} className="gap-2 px-3">
                  {p === "all" ? "All" : PERFORMANCE[p]}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {count(p)}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      </div>

      <p role="status" className="text-sm text-muted-foreground tabular-nums">
        Showing {visible.length} of {videos.length} videos
      </p>

      {visible.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>No videos match</EmptyTitle>
            <EmptyDescription>
              Try a different search, or clear the hook and performance filters.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" variant="outline" onClick={reset}>
              Clear filters
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((x) => (
            <li key={x.id}>
              <Card className="h-full gap-0 overflow-hidden py-0">
                <div className="relative flex aspect-video items-center justify-center bg-muted">
                  <Play className="size-6 text-muted-foreground" aria-hidden />
                  <span className="absolute right-2 bottom-2 rounded-sm bg-foreground/80 px-1.5 py-0.5 text-xs text-background tabular-nums">
                    {x.minutes} min
                  </span>
                </div>
                <CardHeader className="pt-4">
                  <CardTitle className="font-heading text-base leading-snug">
                    {x.title}
                  </CardTitle>
                  <CardDescription className="tabular-nums">
                    <span className="font-medium text-foreground">
                      {compact.format(x.views)} views
                    </span>
                    {" · "}
                    {date.format(new Date(x.publishedAt))}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 py-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          performanceDot[x.performance]
                        )}
                        aria-hidden
                      />
                      {PERFORMANCE[x.performance]}
                    </span>
                    <Badge variant="outline">{HOOKS[x.hook].name}</Badge>
                  </div>
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    <span className="sr-only">Opening line: </span>
                    &ldquo;{x.opening}&rdquo;
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
