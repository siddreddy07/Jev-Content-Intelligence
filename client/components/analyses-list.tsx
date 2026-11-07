"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowUpDown,
  CheckCircle2,
  CircleAlert,
  LayoutGrid,
  LoaderCircle,
  ChevronRight,
  ScanSearch,
  Search,
  SearchX,
} from "lucide-react"

import { analysisHref, type Analysis } from "@/lib/data"
import { computeRun, initialElapsed } from "@/lib/pipeline"
import { StatusBadge } from "@/components/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})
const date = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
})

const tabs = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "active", label: "Active", icon: LoaderCircle },
  { value: "completed", label: "Done", icon: CheckCircle2 },
  { value: "failed", label: "Failed", icon: CircleAlert },
] as const
type Tab = (typeof tabs)[number]["value"]

const sorts = {
  newest: "Newest first",
  oldest: "Oldest first",
  lift: "Biggest gap",
} as const
type Sort = keyof typeof sorts

const inTab = (a: Analysis, tab: Tab) =>
  tab === "all" ||
  (tab === "active"
    ? a.status === "queued" || a.status === "running"
    : a.status === tab)

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")

/** One plain sentence on how the analysis is going. */
function summary(a: Analysis) {
  switch (a.status) {
    case "completed":
      return `${a.videosAnalyzed} videos reviewed`
    case "running":
      return `${a.videosAnalyzed} of 20 videos done`
    case "queued":
      return "Waiting to start"
    case "failed":
      return a.failureReason ?? "Something went wrong"
  }
}

const percentOf = (a: Analysis) =>
  Math.round(computeRun(initialElapsed(a.status)).overall * 100)

export function AnalysesList({ analyses }: { analyses: Analysis[] }) {
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<Tab>("all")
  const [sort, setSort] = useState<Sort>("newest")

  // Search narrows first so each tab's count reflects it.
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase()
    return analyses.filter(
      (a) =>
        !q ||
        a.creator.name.toLowerCase().includes(q) ||
        a.creator.handle.toLowerCase().includes(q)
    )
  }, [analyses, query])

  const visible = useMemo(
    () =>
      searched
        .filter((a) => inTab(a, tab))
        .sort((a, b) => {
          if (sort === "lift")
            return (b.performanceLift ?? -1) - (a.performanceLift ?? -1)
          return sort === "newest"
            ? b.startedAt.localeCompare(a.startedAt)
            : a.startedAt.localeCompare(b.startedAt)
        }),
    [searched, tab, sort]
  )

  if (analyses.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ScanSearch />
          </EmptyMedia>
          <EmptyTitle>No analyses yet</EmptyTitle>
          <EmptyDescription>
            Analyze a channel to see which opening lines drive its best videos.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/analyze">Analyze a channel</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <InputGroup className="h-11 flex-1 bg-card">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators"
            aria-label="Search analyses"
          />
        </InputGroup>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-11 gap-2 px-3">
              <ArrowUpDown className="size-4" />
              <span className="hidden @md/main:inline">{sorts[sort]}</span>
              <span className="sr-only @md/main:hidden">
                Sort: {sorts[sort]}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={sort}
              onValueChange={(v) => setSort(v as Sort)}
            >
              {(Object.keys(sorts) as Sort[]).map((k) => (
                <DropdownMenuRadioItem key={k} value={k}>
                  {sorts[k]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Equal-width segments, count under each label: easy to tap on a phone. */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="grid w-full grid-cols-4">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} aria-label={t.label}>
              <t.icon className="size-4 @md/main:hidden" aria-hidden />
              <span className="hidden @md/main:inline">{t.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {searched.filter((a) => inTab(a, t.value)).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>No analyses match</EmptyTitle>
            <EmptyDescription>
              Try a different name, or switch to another tab.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setQuery("")
                setTab("all")
              }}
            >
              Clear search
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          {/* Phones and tablets: one card per analysis. */}
          <ItemGroup
            className="grid gap-3 @2xl/main:grid-cols-2 @3xl/main:hidden"
            aria-label="Analyses"
          >
            {visible.map((a) => (
              <Item
                key={a.id}
                asChild
                variant="outline"
                className="items-start bg-card p-4"
              >
                <Link href={analysisHref(a)}>
                  <ItemMedia>
                    <Avatar className="size-11">
                      <AvatarFallback className="bg-accent text-sm font-medium text-accent-foreground">
                        {initials(a.creator.name)}
                      </AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="text-base">
                      {a.creator.name}
                    </ItemTitle>
                    <ItemDescription>
                      {a.creator.handle} ·{" "}
                      {compact.format(a.creator.subscribers)} subscribers
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions className="self-center">
                    <ChevronRight
                      className="size-4 text-muted-foreground"
                      aria-hidden
                    />
                  </ItemActions>
                  <ItemFooter className="flex-wrap gap-x-3 gap-y-2 border-t pt-3">
                    <StatusBadge value={a.status} />
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                      {summary(a)}
                    </span>
                    {a.performanceLift !== null && (
                      <span className="text-right tabular-nums">
                        <span className="font-heading text-lg font-semibold">
                          +{a.performanceLift}%
                        </span>
                        <span className="block text-[11px] leading-none text-muted-foreground">
                          best vs recent
                        </span>
                      </span>
                    )}
                    {a.status === "running" && (
                      <Progress
                        value={percentOf(a)}
                        aria-label={`${a.creator.name} progress`}
                        className="basis-full"
                      />
                    )}
                  </ItemFooter>
                </Link>
              </Item>
            ))}
          </ItemGroup>

          {/* Wide content areas: a table. */}
          <Card className="hidden gap-0 overflow-hidden py-0 @3xl/main:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-4">Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Best vs recent</TableHead>
                  <TableHead className="text-right">Started</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((a) => (
                  <TableRow key={a.id} className="relative hover:bg-muted/50">
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
                            {a.creator.handle} ·{" "}
                            {compact.format(a.creator.subscribers)} subscribers
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={a.status} />
                    </TableCell>
                    <TableCell className="w-56 max-w-56">
                      {a.status === "running" ? (
                        <div className="space-y-1.5">
                          <Progress
                            value={percentOf(a)}
                            aria-label={`${a.creator.name} progress`}
                          />
                          <p className="text-xs text-muted-foreground">
                            {summary(a)}
                          </p>
                        </div>
                      ) : (
                        <span className="line-clamp-2 text-sm text-muted-foreground">
                          {summary(a)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {a.performanceLift === null ? (
                        <span className="text-muted-foreground">–</span>
                      ) : (
                        `+${a.performanceLift}%`
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {date.format(new Date(a.startedAt))}
                    </TableCell>
                    <TableCell>
                      <ChevronRight
                        className="size-4 text-muted-foreground"
                        aria-hidden
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}
