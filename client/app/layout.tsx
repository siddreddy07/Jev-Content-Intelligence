import type { Metadata } from "next"
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans" })
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
})

export const metadata: Metadata = {
  title: { default: "Jev Content Intelligence", template: "%s · Jev" },
  description: "Find the spoken hooks that make a creator's videos win.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans antialiased", sans.variable, display.variable)}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
