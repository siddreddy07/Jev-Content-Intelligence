import {
  LayoutDashboard,
  ScanSearch,
  Video,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
}

export const primaryNav: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Analyses", href: "/analyses", icon: ScanSearch },
  { title: "Video explorer", href: "/videos", icon: Video },
]

export const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/analyze": "New analysis",
  "/analyses": "Analyses",
  "/videos": "Video explorer",
}
