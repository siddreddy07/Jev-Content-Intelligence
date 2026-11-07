"use client"

import * as React from "react"

import { STORAGE_KEY } from "@/lib/theme"

type Theme = "light" | "dark"

const listeners = new Set<() => void>()

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => void listeners.delete(onChange)
}

function getSnapshot(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "light" || stored === "dark") return stored
  return "dark"
}

export function useTheme() {
  const resolvedTheme = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => "dark" as Theme
  )

  const setTheme = React.useCallback((theme: Theme) => {
    localStorage.setItem(STORAGE_KEY, theme)
    listeners.forEach((l) => l())
  }, [])

  return { resolvedTheme, setTheme }
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

/** Keeps the <html> class in step with the theme, and adds the "d" shortcut. */
function ThemeEffects() {
  const { resolvedTheme, setTheme } = useTheme()

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark")
  }, [resolvedTheme])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() !== "d") return
      if (isTypingTarget(event.target)) return

      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [resolvedTheme, setTheme])

  return null
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeEffects />
      {children}
    </>
  )
}
