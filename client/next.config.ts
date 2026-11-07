import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // LAN access to the dev server (the "Network" URL printed by `next dev`).
  allowedDevOrigins: ["192.168.29.186"],
}

export default nextConfig
