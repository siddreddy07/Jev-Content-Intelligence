import type { Metadata } from "next"

import { AnalysisProgress } from "@/components/analysis-progress"
import { getAnalysis } from "@/lib/data"

export const metadata: Metadata = { title: "Analysis progress" }

export default async function AnalysisPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const [{ id }, { channel }] = await Promise.all([params, searchParams])
  const analysis = await getAnalysis(id)

  // Newly submitted analyses aren't in the mock list; label them from the URL.
  const fromUrl =
    typeof channel === "string"
      ? channel.split("/").filter(Boolean).pop()
      : undefined

  return (
    <AnalysisProgress
      id={id}
      name={analysis?.creator.name ?? fromUrl ?? "New analysis"}
      handle={analysis?.creator.handle}
      seedStatus={analysis?.status}
      failureReason={analysis?.failureReason}
    />
  )
}
