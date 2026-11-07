/**
 * Mock of the 8-stage analysis pipeline. Pure functions of elapsed time, so
 * the UI can render any moment of a run. The backend will replace this with
 * stage events streamed over SSE.
 */

export type StageStatus = "pending" | "running" | "completed" | "failed"
export type RunStatus = "running" | "completed" | "failed"

const STAGE_DEFS = [
  {
    title: "Channel discovery",
    description: "Resolving the channel and listing its public uploads.",
    seconds: 4,
    total: 312,
    unit: "videos found",
  },
  {
    title: "Metadata analysis",
    description: "Reading titles, view counts and publish dates.",
    seconds: 6,
    total: 312,
    unit: "videos read",
  },
  {
    title: "Video selection",
    description: "Picking the 10 most-viewed and the 10 most recent videos.",
    seconds: 3,
    total: 20,
    unit: "selected",
  },
  {
    title: "Audio extraction",
    description: "Pulling the opening audio from each selected video.",
    seconds: 10,
    total: 20,
    unit: "extracted",
  },
  {
    title: "Transcription",
    description: "Transcribing the opening seconds of speech.",
    seconds: 14,
    total: 20,
    unit: "transcribed",
  },
  {
    title: "Spoken-hook analysis",
    description: "Classifying how each video opens.",
    seconds: 9,
    total: 20,
    unit: "hooks classified",
  },
  {
    title: "Performance comparison",
    description: "Comparing the top 10 against the latest 10 by views.",
    seconds: 5,
  },
  {
    title: "Creator snapshot generation",
    description: "Assembling hook patterns, lift and blind spots.",
    seconds: 4,
  },
] as const

/** Activity-log line written when each stage finishes. */
const DONE = [
  "Found 312 public videos on the channel.",
  "Read titles, views and dates for 312 videos.",
  "Chose the 10 most-viewed and 10 newest videos.",
  "Extracted opening audio from 20 videos.",
  "Transcribed the opening lines of 20 videos.",
  "Identified the hook in 20 videos.",
  "Compared the top 10 with the latest 10.",
  "Creator snapshot is ready.",
]

export const TOTAL_SECONDS = STAGE_DEFS.reduce((n, s) => n + s.seconds, 0)
export const FAIL_STAGE = 3 // the seeded failed run stops at audio extraction
export const FAIL_MESSAGE = "Audio extraction failed for 12 of 20 videos."

const FAIL_POINT = 0.6 // fraction of the stage completed when it fails

export type Stage = {
  title: string
  description: string
  status: StageStatus
  /** Counts, e.g. "12 of 20 extracted". Only for stages that have them. */
  detail?: string
  /** Seconds the stage took, once finished or failed. */
  seconds?: number
  /** 0 to 1 within the stage, while running. */
  progress?: number
  /** Elapsed second at which the stage finished or failed. */
  finishedAt?: number
  /** Activity-log message, once completed. */
  message?: string
}

export type Run = {
  stages: Stage[]
  status: RunStatus
  /** 0 to 1 across the whole pipeline. */
  overall: number
  /** Index of the running or failed stage, or null when complete. */
  current: number | null
}

export function stageStart(index: number) {
  return STAGE_DEFS.slice(0, index).reduce((n, s) => n + s.seconds, 0)
}

/** Where in the pipeline a run of this status begins, in elapsed seconds. */
export function initialElapsed(status?: string) {
  if (status === "completed" || status === "failed") return TOTAL_SECONDS + 5
  if (status === "running") return 30
  return 0
}

function count(def: (typeof STAGE_DEFS)[number], fraction: number) {
  if (!("total" in def)) return undefined
  return `${Math.floor(def.total * fraction)} of ${def.total} ${def.unit}`
}

/** State of the pipeline `elapsed` seconds in. `failAt` marks a stage that fails. */
export function computeRun(elapsed: number, failAt?: number): Run {
  const failTime =
    failAt === undefined
      ? Infinity
      : stageStart(failAt) + STAGE_DEFS[failAt].seconds * FAIL_POINT
  const failed = failAt !== undefined && elapsed >= failTime

  const stages: Stage[] = STAGE_DEFS.map((def, i) => {
    const start = stageStart(i)
    const base = { title: def.title, description: def.description }

    if (failed && i === failAt) {
      return {
        ...base,
        status: "failed",
        detail: count(def, FAIL_POINT),
        seconds: Math.round(failTime - start),
        finishedAt: failTime,
      }
    }
    if (failed && i > failAt!) return { ...base, status: "pending" }
    if (elapsed >= start + def.seconds) {
      return {
        ...base,
        status: "completed",
        detail: count(def, 1),
        seconds: def.seconds,
        finishedAt: start + def.seconds,
        message: DONE[i],
      }
    }
    if (elapsed > start) {
      const progress = (elapsed - start) / def.seconds
      return {
        ...base,
        status: "running",
        detail: count(def, progress),
        progress,
      }
    }
    return { ...base, status: "pending" }
  })

  const current = stages.findIndex(
    (s) => s.status === "running" || s.status === "failed"
  )
  return {
    stages,
    status: failed
      ? "failed"
      : elapsed >= TOTAL_SECONDS
        ? "completed"
        : "running",
    overall: Math.min(1, (failed ? failTime : elapsed) / TOTAL_SECONDS),
    current: current === -1 ? null : current,
  }
}

export function formatElapsed(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}
