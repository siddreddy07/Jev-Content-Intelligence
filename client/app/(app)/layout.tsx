import { AppShell } from "@/components/app-shell"
import { listAnalyses } from "@/lib/data"
import { computeRun, initialElapsed } from "@/lib/pipeline"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const analyses = await listAnalyses()
  const running = analyses
    .filter((a) => a.status === "running" || a.status === "queued")
    .map((a) => {
      const run = computeRun(initialElapsed(a.status))
      return {
        id: a.id,
        name: a.creator.name,
        percent: Math.round(run.overall * 100),
        detail:
          a.status === "queued"
            ? "Waiting to start"
            : `Step ${run.current! + 1} of 8 · ${run.stages[run.current!].title}`,
      }
    })

  return <AppShell running={running}>{children}</AppShell>
}
