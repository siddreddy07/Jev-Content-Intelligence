import type { Metadata } from "next"
import { Clock } from "lucide-react"

import { AnalysisForm } from "@/components/analysis-form"

export const metadata: Metadata = { title: "New analysis" }

const covers = [
  ["Top 10 videos", "Highest-viewed videos, the baseline for what wins."],
  ["Latest 10 videos", "Most recent uploads, compared against that baseline."],
  [
    "Spoken hooks",
    "The opening seconds of each video are transcribed and classified.",
  ],
  ["Snapshot", "Hook patterns, performance lift and blind spots."],
]

export default async function AnalyzePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { url } = await searchParams

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Analyze a creator</h1>
          <p className="max-w-lg text-muted-foreground">
            Paste a channel URL to find the spoken hooks behind their best
            videos.
          </p>
        </div>
        <div className="max-w-xl">
          <AnalysisForm initialUrl={typeof url === "string" ? url : ""} />
        </div>
      </div>

      <aside aria-labelledby="covers" className="space-y-5">
        <h2 id="covers" className="text-base font-semibold">
          What this analysis covers
        </h2>
        <ul className="divide-y border-y">
          {covers.map(([title, detail]) => (
            <li key={title} className="space-y-0.5 py-3">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{detail}</p>
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" aria-hidden />8 processing stages, about 8
          to 12 minutes.
        </p>
      </aside>
    </div>
  )
}
