import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AnalysisStatus } from "@/lib/data"

const status: Record<AnalysisStatus, { label: string; dot: string }> = {
  queued: { label: "Queued", dot: "bg-muted-foreground/50" },
  running: { label: "Running", dot: "bg-primary motion-safe:animate-pulse" },
  completed: { label: "Completed", dot: "bg-success" },
  failed: { label: "Failed", dot: "bg-destructive" },
}

export function StatusBadge({ value }: { value: AnalysisStatus }) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <span
        className={cn("size-1.5 rounded-full", status[value].dot)}
        aria-hidden
      />
      {status[value].label}
    </Badge>
  )
}
