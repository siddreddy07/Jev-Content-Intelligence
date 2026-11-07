"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Link2 } from "lucide-react"

import { submitAnalysis } from "@/lib/data"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

/** Returns an error message, or the normalized channel URL. */
function parseChannelUrl(input: string): { error: string } | { url: string } {
  const raw = input.trim()
  if (!raw) return { error: "Enter a YouTube channel URL." }

  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  } catch {
    return { error: "That doesn't look like a URL." }
  }
  if (
    !["youtube.com", "www.youtube.com", "m.youtube.com"].includes(
      url.hostname.toLowerCase()
    )
  ) {
    return { error: "Use a youtube.com channel URL." }
  }

  const [first, second] = url.pathname.split("/").filter(Boolean)
  const base = "https://www.youtube.com"

  if (first?.startsWith("@") && first.length > 1)
    return { url: `${base}/${first}` }
  if (first === "channel" && /^UC[\w-]{22}$/.test(second ?? ""))
    return { url: `${base}/channel/${second}` }
  if ((first === "c" || first === "user") && second)
    return { url: `${base}/${first}/${second}` }
  if (["watch", "shorts", "playlist"].includes(first ?? ""))
    return {
      error: "That's a video or playlist link. Paste the channel URL instead.",
    }

  return { error: "Use a channel URL like youtube.com/@handle." }
}

export function AnalysisForm({ initialUrl = "" }: { initialUrl?: string }) {
  const router = useRouter()
  const [value, setValue] = useState(initialUrl)
  const [error, setError] = useState<string>()
  const [state, setState] = useState<"editing" | "submitting">("editing")

  function validate() {
    const result = parseChannelUrl(value)
    setError("error" in result ? result.error : undefined)
    return result
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = validate()
    if ("error" in result) return

    setState("submitting")
    try {
      const { id } = await submitAnalysis(result.url)
      // Stay in the submitting state while navigating to avoid a double submit.
      router.push(`/analyses/${id}?channel=${encodeURIComponent(result.url)}`)
    } catch {
      setError(
        "Couldn't start the analysis. Check your connection and try again."
      )
      setState("editing")
    }
  }

  const submitting = state === "submitting"

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="channel-url">YouTube channel URL</FieldLabel>
        <InputGroup className="h-11 bg-card">
          <InputGroupAddon>
            <Link2 />
          </InputGroupAddon>
          <InputGroupInput
            id="channel-url"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError(undefined)
            }}
            onBlur={() => value.trim() && validate()}
            placeholder="youtube.com/@creator"
            inputMode="url"
            autoComplete="off"
            autoFocus
            disabled={submitting}
            aria-invalid={error ? true : undefined}
          />
        </InputGroup>
        {error ? (
          <FieldError>{error}</FieldError>
        ) : (
          <FieldDescription>
            Accepts @handle, /channel/ID, /c/name and /user/name links.
          </FieldDescription>
        )}
      </Field>

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting && <Spinner data-icon="inline-start" />}
        {submitting ? "Starting analysis" : "Start analysis"}
      </Button>
    </form>
  )
}
