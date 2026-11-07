import type { Metadata } from "next"

import { AnalysesList } from "@/components/analyses-list"
import { listAnalyses } from "@/lib/data"

export const metadata: Metadata = { title: "Analyses" }

export default async function AnalysesPage() {
  const analyses = await listAnalyses()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Analyses</h1>
        <p className="max-w-xl text-muted-foreground">
          Every channel you&apos;ve analyzed. Open a finished one for its
          snapshot, or a running one to follow its progress.
        </p>
      </div>
      <AnalysesList analyses={analyses} />
    </div>
  )
}
