import type { Metadata } from "next"
import { GitCompareArrows, Mic, Wrench } from "lucide-react"

import { AnalysisForm } from "@/components/analysis-form"

export const metadata: Metadata = { title: "Analyze a channel" }

const learn = [
  {
    icon: Mic,
    title: "What works",
    detail: "The opening lines behind their most-viewed videos.",
  },
  {
    icon: GitCompareArrows,
    title: "What changed",
    detail: "How their newest videos compare with their best.",
  },
  {
    icon: Wrench,
    title: "What to fix",
    detail: "Where recent videos drift away, with examples.",
  },
]

export default async function AnalyzePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { url } = await searchParams

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Analyze a YouTube channel</h1>
        <p className="text-muted-foreground">
          See which opening lines make a creator&apos;s videos win, and whether
          their newest videos still use them.
        </p>
      </div>

      <AnalysisForm initialUrl={typeof url === "string" ? url : ""} />

      <section aria-labelledby="learn" className="space-y-4">
        <h2 id="learn" className="text-base font-semibold">
          What you&apos;ll learn
        </h2>
        <ul className="grid gap-5 sm:grid-cols-3">
          {learn.map(({ icon: Icon, title, detail }) => (
            <li key={title} className="space-y-2">
              <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
