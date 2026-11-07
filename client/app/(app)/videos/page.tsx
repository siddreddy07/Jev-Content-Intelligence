import type { Metadata } from "next"

import { VideoExplorer } from "@/components/video-explorer"
import { classifyVideos } from "@/lib/snapshot"

export const metadata: Metadata = { title: "Video explorer" }

export default function VideosPage() {
  const videos = classifyVideos()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Video explorer</h1>
        <p className="max-w-xl text-muted-foreground">
          All {videos.length} videos from the latest completed analysis. Search
          their titles and opening lines, or filter by hook and performance.
        </p>
      </div>
      <VideoExplorer videos={videos} />
    </div>
  )
}
