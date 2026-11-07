"use client"

import Link from "next/link"
import type { ComponentProps } from "react"
import { Fragment } from "react"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Moon,
  Plus,
  ScanSearch,
  Sun,
  Video,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"

import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

/** A link that also closes the slide-in sidebar on phones and tablets. */
function NavLink(props: ComponentProps<typeof Link>) {
  const { setOpenMobile } = useSidebar()
  return <Link {...props} onClick={() => setOpenMobile(false)} />
}

const nav = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Analyses", href: "/analyses", icon: ScanSearch },
  { title: "Video explorer", href: "/videos", icon: Video },
]

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/analyze": "New analysis",
  "/analyses": "Analyses",
  "/videos": "Video explorer",
}

export type RunningAnalysis = {
  id: string
  name: string
  /** Short status line, e.g. "Step 5 of 8". */
  detail: string
  percent: number
}

/** Breadcrumb trail for the current route. */
function crumbs(pathname: string) {
  const [, section, id, leaf] = pathname.split("/")
  if (section === "analyses" && id) {
    return [
      { label: "Analyses", href: "/analyses" },
      leaf
        ? { label: "Progress", href: `/analyses/${id}` }
        : { label: "Progress" },
      ...(leaf ? [{ label: "Snapshot" }] : []),
    ]
  }
  return [{ label: titles[pathname] ?? "Jev" }]
}

export function AppShell({
  children,
  running = [],
}: {
  children: React.ReactNode
  running?: RunningAnalysis[]
}) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <SidebarProvider>
      <a
        href="#main"
        className="sr-only fixed top-3 left-3 z-50 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only"
      >
        Skip to content
      </a>
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-3">
          <NavLink
            href="/"
            className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <svg viewBox="0 0 24 24" className="size-7 shrink-0" aria-hidden>
              <rect
                width="24"
                height="24"
                rx="6"
                className="fill-sidebar-primary"
              />
              {/* waveform resolving into a "J" stem: the opening seconds of a video */}
              <path
                d="M5 12h.01M8 9.5v5M11 6.5v8.5a3 3 0 0 1-3 3M14 10v4M17 11.2v1.6M19.5 12h.01"
                className="stroke-sidebar-primary-foreground"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="font-heading text-[15px] font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
              Jev
              <span className="ml-1.5 font-normal text-sidebar-foreground/60">
                Content Intelligence
              </span>
            </span>
          </NavLink>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="px-3 pt-4">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {nav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      className="h-10"
                      tooltip={item.title}
                      isActive={
                        item.href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.href)
                      }
                    >
                      <NavLink href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {running.length > 0 && (
            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel className="gap-2">
                Running now
                <span className="rounded-full bg-sidebar-accent px-1.5 text-xs text-sidebar-accent-foreground tabular-nums">
                  {running.length}
                </span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <ul className="space-y-2">
                  {running.map((r) => (
                    <li key={r.id}>
                      <NavLink
                        href={`/analyses/${r.id}`}
                        className="block space-y-1.5 rounded-lg px-2 py-2 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                      >
                        <span className="block truncate text-sm font-medium text-sidebar-accent-foreground">
                          {r.name}
                        </span>
                        <span className="block h-1 overflow-hidden rounded-full bg-sidebar-accent">
                          <span
                            className="block h-full rounded-full bg-sidebar-primary"
                            style={{ width: `${r.percent}%` }}
                          />
                        </span>
                        <span className="block text-xs text-sidebar-foreground/60">
                          {r.detail}
                        </span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="group-data-[collapsible=icon]:hidden">
          <div className="space-y-2 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3 text-xs leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-foreground" />
              <span>
                <span className="font-medium text-sidebar-accent-foreground">
                  Measured
                </span>{" "}
                numbers come from YouTube.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-ai" />
              <span>
                <span className="font-medium text-sidebar-accent-foreground">
                  AI
                </span>{" "}
                interpretations are marked.
              </span>
            </p>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-1 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {crumbs(pathname).map((c, i, all) => (
                <Fragment key={c.label}>
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {i === all.length - 1 || !c.href ? (
                      <BreadcrumbPage className="font-medium">
                        {c.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={c.href}>{c.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <Button asChild size="sm" className="ml-auto">
            <Link href="/analyze">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Analyze channel</span>
              <span className="sr-only sm:hidden">Analyze channel</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle color theme"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
          </Button>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="@container/main mx-auto w-full max-w-6xl flex-1 px-4 py-5 md:px-8 md:py-8"
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
