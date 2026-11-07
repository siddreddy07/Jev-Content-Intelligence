import { AppHeader } from "@/components/shell/app-header"
import { AppSidebar } from "@/components/shell/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
