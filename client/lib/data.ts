/**
 * Types, mock data and the data-access functions the UI calls.
 * Each async function can become a `fetch` to the REST API later without
 * touching any component.
 */

export type AnalysisStatus = "queued" | "running" | "completed" | "failed"

export type Analysis = {
  id: string
  creator: { name: string; handle: string; subscribers: number }
  status: AnalysisStatus
  videosAnalyzed: number
  /** Top-10 vs latest-10 views lift, in percent. Null until computed. */
  performanceLift: number | null
  startedAt: string
  failureReason?: string
  /** Relative views of the creator's videos, oldest to newest. Completed only. */
  trend?: number[]
}

const seed: Omit<Analysis, "trend">[] = [
  {
    id: "an_01",
    creator: {
      name: "Maya Okafor",
      handle: "@mayabuilds",
      subscribers: 482_000,
    },
    status: "running",
    videosAnalyzed: 7,
    performanceLift: null,
    startedAt: "2026-11-07T08:42:00Z",
  },
  {
    id: "an_02",
    creator: {
      name: "Dan Reyes",
      handle: "@danreyesfit",
      subscribers: 1_240_000,
    },
    status: "completed",
    videosAnalyzed: 20,
    performanceLift: 64,
    startedAt: "2026-11-06T17:15:00Z",
  },
  {
    id: "an_03",
    creator: { name: "Priya Nair", handle: "@priyacooks", subscribers: 96_300 },
    status: "completed",
    videosAnalyzed: 20,
    performanceLift: 31,
    startedAt: "2026-11-05T11:03:00Z",
  },
  {
    id: "an_04",
    creator: {
      name: "Lukas Brandt",
      handle: "@lukasbrandt",
      subscribers: 2_050_000,
    },
    status: "failed",
    videosAnalyzed: 0,
    performanceLift: null,
    startedAt: "2026-11-04T20:31:00Z",
    failureReason: "Audio extraction failed for 12 of 20 videos.",
  },
  {
    id: "an_05",
    creator: {
      name: "Sana Whitfield",
      handle: "@sanaexplains",
      subscribers: 311_000,
    },
    status: "completed",
    videosAnalyzed: 19,
    performanceLift: 12,
    startedAt: "2026-11-02T09:48:00Z",
  },
  {
    id: "an_06",
    creator: {
      name: "Theo Marchetti",
      handle: "@theotravels",
      subscribers: 58_700,
    },
    status: "queued",
    videosAnalyzed: 0,
    performanceLift: null,
    startedAt: "2026-11-07T09:05:00Z",
  },
]

/** Deterministic mock series that falls by roughly what the lift implies. */
function makeTrend(lift: number, salt: number) {
  const end = 1 / (1 + lift / 100)
  return Array.from({ length: 20 }, (_, i) => {
    const t = i / 19
    return Math.round((1 - t * (1 - end)) * 100 + Math.sin(i * 1.7 + salt) * 7)
  })
}

const mockAnalyses: Analysis[] = seed.map((a) => ({
  ...a,
  trend:
    a.status === "completed" && a.performanceLift !== null
      ? makeTrend(a.performanceLift, a.creator.name.length)
      : undefined,
}))

export async function getAnalysis(id: string) {
  return mockAnalyses.find((a) => a.id === id)
}

export async function listAnalyses() {
  return [...mockAnalyses].sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt)
  )
}

/** Finished analyses open the snapshot; everything else shows progress. */
export function analysisHref(a: Analysis) {
  return a.status === "completed"
    ? `/analyses/${a.id}/snapshot?name=${encodeURIComponent(a.creator.name)}`
    : `/analyses/${a.id}`
}

export async function getDashboard() {
  const analyses = await listAnalyses()
  const lifts = analyses.flatMap((a) =>
    a.status === "completed" && a.performanceLift !== null
      ? [a.performanceLift]
      : []
  )

  return {
    analyses,
    stats: {
      creatorsAnalyzed: lifts.length,
      videosAnalyzed: analyses.reduce((n, a) => n + a.videosAnalyzed, 0),
      averageLift: lifts.length
        ? Math.round(lifts.reduce((s, n) => s + n, 0) / lifts.length)
        : null,
      inProgress: analyses.filter(
        (a) => a.status === "queued" || a.status === "running"
      ).length,
    },
  }
}

export async function submitAnalysis(channelUrl: string) {
  // Simulated latency. Real version: POST /analyses { channelUrl }.
  await new Promise((resolve) => setTimeout(resolve, 1400))
  void channelUrl
  return { id: `an_${Date.now().toString(36)}` }
}
