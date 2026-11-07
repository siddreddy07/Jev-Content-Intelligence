/**
 * Mock creator snapshot. The raw videos and the AI-written interpretations are
 * the only hand-written parts; every measured number (averages, lift, shares,
 * alignment) is computed from the videos, so the two can never disagree.
 */

export type Group = "top" | "latest"
export type Confidence = "high" | "medium" | "low"

export type HookId =
  | "result-first"
  | "bold-claim"
  | "direct-callout"
  | "question"
  | "story"
  | "greeting"

export const HOOKS: Record<HookId, { name: string; description: string }> = {
  "result-first": {
    name: "Result first",
    description: "States the outcome before explaining how it happened.",
  },
  "bold-claim": {
    name: "Bold claim",
    description: "Opens with a strong, slightly contrarian statement.",
  },
  "direct-callout": {
    name: "Direct call-out",
    description: "Names the viewer's exact problem in the first sentence.",
  },
  question: {
    name: "Open question",
    description: "Poses a broad question and promises to explore it.",
  },
  story: {
    name: "Personal story",
    description: "Starts from a moment in the creator's own journey.",
  },
  greeting: {
    name: "Greeting",
    description: "Opens with a welcome or update before the topic.",
  },
}

export type SnapshotVideo = {
  id: string
  title: string
  group: Group
  views: number
  publishedAt: string
  minutes: number
  hook: HookId
  /** First spoken line, from the transcript. */
  opening: string
}

const v = (
  id: string,
  group: Group,
  title: string,
  views: number,
  publishedAt: string,
  minutes: number,
  hook: HookId,
  opening: string
): SnapshotVideo => ({
  id,
  group,
  title,
  views,
  publishedAt,
  minutes,
  hook,
  opening,
})

export const videos: SnapshotVideo[] = [
  v(
    "t1",
    "top",
    "I rebuilt my entire workflow in one weekend",
    1_420_000,
    "2025-03-12",
    9,
    "result-first",
    "This weekend I cut my editing time from nine hours to two, and here's exactly how."
  ),
  v(
    "t2",
    "top",
    "How I edit videos 3x faster (full process)",
    1_210_000,
    "2025-05-02",
    12,
    "result-first",
    "Three times faster. That's what this workflow gave me, and I'll show every step."
  ),
  v(
    "t3",
    "top",
    "Stop doing this if you want to grow",
    1_120_000,
    "2025-01-21",
    8,
    "bold-claim",
    "Most advice about posting schedules is wrong, and it's costing you subscribers."
  ),
  v(
    "t4",
    "top",
    "I tried the 30-day posting challenge",
    1_050_000,
    "2024-11-08",
    11,
    "result-first",
    "I gained 11,000 subscribers in 30 days. The surprise is how."
  ),
  v(
    "t5",
    "top",
    "If your videos get stuck at 500 views, watch this",
    980_000,
    "2025-02-17",
    10,
    "direct-callout",
    "If your last five videos all stalled around 500 views, this is for you."
  ),
  v(
    "t6",
    "top",
    "Nobody tells beginners this about thumbnails",
    930_000,
    "2024-09-30",
    7,
    "bold-claim",
    "Your thumbnail isn't the problem. Your first three seconds are."
  ),
  v(
    "t7",
    "top",
    "0 to 10K subscribers: what actually worked",
    880_000,
    "2024-12-14",
    14,
    "result-first",
    "Ten thousand subscribers in eight months. Only three things made the difference."
  ),
  v(
    "t8",
    "top",
    "Why do some videos explode and others don't?",
    830_000,
    "2025-04-06",
    9,
    "question",
    "Why does one video get a million views while its twin gets four thousand?"
  ),
  v(
    "t9",
    "top",
    "The video that almost ended my channel",
    790_000,
    "2024-10-19",
    13,
    "story",
    "Two years ago I uploaded a video that nearly made me quit."
  ),
  v(
    "t10",
    "top",
    "Your intro is losing you viewers",
    760_000,
    "2025-06-11",
    8,
    "direct-callout",
    "Check your retention graph. If it drops in the first ten seconds, here's why."
  ),
  v(
    "l1",
    "latest",
    "What I'd do differently starting over",
    880_000,
    "2026-10-28",
    18,
    "result-first",
    "If I started again today I'd reach 100K a year faster, and this is the plan."
  ),
  v(
    "l2",
    "latest",
    "Is posting daily still worth it?",
    810_000,
    "2026-10-14",
    22,
    "question",
    "Is posting every day still worth it in 2026? Let's find out."
  ),
  v(
    "l3",
    "latest",
    "Weekly update: behind the scenes",
    720_000,
    "2026-10-07",
    16,
    "greeting",
    "Hey everyone, welcome back. Quick update on what I've been working on."
  ),
  v(
    "l4",
    "latest",
    "The editing trick nobody uses",
    640_000,
    "2026-09-30",
    20,
    "bold-claim",
    "There's one editing move almost nobody uses, and it changes how videos feel."
  ),
  v(
    "l5",
    "latest",
    "Hey everyone, welcome back to the channel",
    590_000,
    "2026-09-22",
    25,
    "greeting",
    "Hey everyone, welcome back to the channel. Today we're talking about growth."
  ),
  v(
    "l6",
    "latest",
    "Should you quit your day job for YouTube?",
    560_000,
    "2026-09-15",
    19,
    "question",
    "Should you quit your day job to do this full time? Honestly, it depends."
  ),
  v(
    "l7",
    "latest",
    "My gear tour 2026",
    520_000,
    "2026-09-08",
    17,
    "greeting",
    "Welcome back! Today I'm finally showing you everything on my desk."
  ),
  v(
    "l8",
    "latest",
    "A year of full-time creating",
    480_000,
    "2026-08-31",
    23,
    "story",
    "A year ago this week I left my job. Here's what happened."
  ),
  v(
    "l9",
    "latest",
    "Does the algorithm hate small channels?",
    460_000,
    "2026-08-24",
    21,
    "question",
    "Does the algorithm really hate small channels? I looked at the data."
  ),
  v(
    "l10",
    "latest",
    "Channel Q&A, you asked",
    420_000,
    "2026-08-17",
    15,
    "greeting",
    "Hi all, thanks for the questions. Let's get into them."
  ),
]

export type Interpretation = {
  title: string
  detail: string
  confidence: Confidence
  /** What the confidence rests on. */
  basis: string
  /** Ids of supporting videos. */
  evidence: string[]
}

const aiSummary =
  "Early success came from stating a specific result in the first sentence. Recent uploads have moved toward open questions and greetings, and views have slipped as a result. The strongest opportunity is returning to result-first openings."

const contentPatterns: Interpretation[] = [
  {
    title: "Top videos are short and outcome-driven",
    detail:
      "Process and result videos fill most top slots and run about half the length of recent uploads.",
    confidence: "high",
    basis: "8 of 10 top videos",
    evidence: ["t1", "t2", "t4"],
  },
  {
    title: "Personal stakes beat general topics",
    detail:
      "Videos that tie the topic to the creator's own numbers or story outperform broad explainers.",
    confidence: "medium",
    basis: "6 of 20 videos",
    evidence: ["t9", "t7", "l8"],
  },
  {
    title: "Recent uploads lean on open-ended questions",
    detail:
      "Four of the latest ten pose a broad question, a format that earns below the channel average.",
    confidence: "high",
    basis: "4 of 10 latest videos",
    evidence: ["l2", "l6", "l9"],
  },
]

const blindSpots: Interpretation[] = [
  {
    title: "Recent videos open with a greeting",
    detail:
      "Four of the latest ten start with a welcome line. None of the top ten do, and these average the lowest views of any hook.",
    confidence: "high",
    basis: "4 of 10 latest videos",
    evidence: ["l3", "l5", "l10"],
  },
  {
    title: "The result-first opening has nearly disappeared",
    detail:
      "It opened four of the top ten but only one of the latest ten, even though it earns the most views.",
    confidence: "high",
    basis: "5 videos use it",
    evidence: ["t1", "t2", "l1"],
  },
  {
    title: "Videos have doubled in length",
    detail:
      "Average runtime grew from about 10 to about 20 minutes. This may contribute to the drop, but the data can't prove it.",
    confidence: "low",
    basis: "Correlation across 20 videos",
    evidence: ["t6", "l5"],
  },
]

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const avg = (xs: number[]) => sum(xs) / xs.length

export function getSnapshot() {
  const top = videos.filter((x) => x.group === "top")
  const latest = videos.filter((x) => x.group === "latest")
  const overallAvg = avg(videos.map((x) => x.views))

  // Hook patterns: measured from the (AI-labelled) hook of each video.
  const patterns = (Object.keys(HOOKS) as HookId[])
    .map((id) => {
      const used = videos.filter((x) => x.hook === id)
      const avgViews = avg(used.map((x) => x.views))
      const n = used.length
      return {
        id,
        ...HOOKS[id],
        count: n,
        topCount: used.filter((x) => x.group === "top").length,
        latestCount: used.filter((x) => x.group === "latest").length,
        avgViews,
        lift: Math.round((avgViews / overallAvg - 1) * 100),
        confidence: (n >= 5 ? "high" : n >= 3 ? "medium" : "low") as Confidence,
        example: used[0].opening,
      }
    })
    .sort((a, b) => b.avgViews - a.avgViews)

  const winning = new Set(patterns.filter((p) => p.lift > 0).map((p) => p.id))
  const topWinning = top.filter((x) => winning.has(x.hook)).length
  const latestWinning = latest.filter((x) => winning.has(x.hook)).length

  const topAvg = avg(top.map((x) => x.views))
  const latestAvg = avg(latest.map((x) => x.views))

  return {
    videos,
    top,
    latest,
    maxViews: Math.max(...videos.map((x) => x.views)),
    comparison: {
      topAvg,
      latestAvg,
      lift: Math.round((topAvg / latestAvg - 1) * 100),
      topMinutes: Math.round(avg(top.map((x) => x.minutes))),
      latestMinutes: Math.round(avg(latest.map((x) => x.minutes))),
    },
    patterns,
    winningIds: [...winning],
    alignment: {
      topWinning,
      latestWinning,
      score: Math.round((latestWinning / topWinning) * 100),
    },
    aiSummary,
    contentPatterns,
    blindSpots,
    generatedAt: "2026-11-07",
    transcribed: videos.length,
  }
}

export type Snapshot = ReturnType<typeof getSnapshot>
