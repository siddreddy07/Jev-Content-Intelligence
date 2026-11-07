import type { Metadata } from "next"

import { VideoExplorer } from "@/components/video-explorer"
import { classifyVideos, getSnapshot } from "@/lib/snapshot"

export const metadata: Metadata = { title: "Video explorer" }

export default function VideosPage() {
  const videos = classifyVideos()
  const best = getSnapshot().patterns[0]

  return (
    <VideoExplorer
      videos={videos}
      insight={{
        name: best.name,
        lift: best.lift,
        count: best.count,
        description: best.description,
      }}
    />
  )
}
