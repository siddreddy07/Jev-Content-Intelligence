"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowRight, CheckCircle2, ClipboardPaste, Link2 } from "lucide-react"

import { submitAnalysis } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

type Parsed = { error: string } | { url: string; label: string }

/** Validates a YouTube channel link; returns the cleaned link and a display name. */
function parseChannelUrl(input: string): Parsed {
  const raw = input.trim()
  if (!raw) return { error: "Paste a YouTube channel link to continue." }

  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  } catch {
    return {
      error:
        "That doesn't look like a link. Copy it from your browser's address bar.",
    }
  }
  if (
    !["youtube.com", "www.youtube.com", "m.youtube.com"].includes(
      url.hostname.toLowerCase()
    )
  ) {
    return {
      error:
        "That isn't a YouTube link. Use a link that starts with youtube.com.",
    }
  }

  const [first, second] = url.pathname.split("/").filter(Boolean)
  const base = "https://www.youtube.com"

  if (first?.startsWith("@") && first.length > 1)
    return { url: `${base}/${first}`, label: first }
  if (first === "channel" && /^UC[\w-]{22}$/.test(second ?? ""))
    return { url: `${base}/channel/${second}`, label: "this channel" }
  if ((first === "c" || first === "user") && second)
    return { url: `${base}/${first}/${second}`, label: second }
  if (["watch", "shorts", "playlist"].includes(first ?? ""))
    return {
      error:
        "That link goes to a video or playlist. Open the channel's page and copy that link instead.",
    }

  return {
    error:
      "We couldn't find a channel in that link. It should look like youtube.com/@channelname.",
  }
}

const samples = [
  { name: "Maya Okafor", link: "youtube.com/@mayabuilds" },
  { name: "Dan Reyes", link: "youtube.com/@danreyesfit" },
]

export function AnalysisForm({ initialUrl = "" }: { initialUrl?: string }) {
  const router = useRouter()
  const [value, setValue] = useState(initialUrl)
  const [touched, setTouched] = useState(initialUrl !== "")
  const [submitError, setSubmitError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  const parsed = parseChannelUrl(value)
  const valid = !("error" in parsed)
  // Show errors only once the user has typed and left the field, or tried to submit.
  const error = touched && !valid ? parsed.error : submitError

  async function paste() {
    try {
      setValue(await navigator.clipboard.readText())
      setTouched(true)
      setSubmitError(undefined)
    } catch {
      // Clipboard access can be blocked; typing still works.
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!valid) return

    setSubmitting(true)
    setSubmitError(undefined)
    try {
      const { id } = await submitAnalysis(parsed.url)
      // Stay in the submitting state while navigating to avoid a double submit.
      router.push(`/analyses/${id}?channel=${encodeURIComponent(parsed.url)}`)
    } catch {
      setSubmitError(
        "We couldn't start the analysis. Check your connection and try again."
      )
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate className="contents">
        <CardContent className="space-y-4">
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="channel-url" className="text-base">
              Which channel?
            </FieldLabel>
            <InputGroup className="h-12 bg-background">
              <InputGroupAddon>
                <Link2 />
              </InputGroupAddon>
              <InputGroupInput
                id="channel-url"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setSubmitError(undefined)
                }}
                onBlur={() => value.trim() && setTouched(true)}
                placeholder="Paste a channel link"
                inputMode="url"
                autoComplete="off"
                autoFocus
                disabled={submitting}
                aria-invalid={error ? true : undefined}
                className="text-base"
              />
              {!value && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton onClick={paste} disabled={submitting}>
                    <ClipboardPaste />
                    Paste
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>

            {error ? (
              <FieldError>{error}</FieldError>
            ) : valid ? (
              <p
                role="status"
                className="flex items-center gap-1.5 text-sm text-success"
              >
                <CheckCircle2 className="size-4" aria-hidden />
                Found {parsed.label}. Ready to analyze.
              </p>
            ) : (
              <FieldDescription>
                On YouTube, open the channel&apos;s page and copy the address
                from your browser.
              </FieldDescription>
            )}
          </Field>

          {!value && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">No link handy? Try</span>
              {samples.map((s) => (
                <Button
                  key={s.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setValue(s.link)
                    setTouched(true)
                  }}
                >
                  {s.name}
                </Button>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            We&apos;ll study their 10 most-viewed and 10 newest videos. It takes
            about 10 minutes and keeps running if you leave the page.
          </p>
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="shrink-0"
          >
            {submitting ? (
              <>
                <Spinner data-icon="inline-start" />
                Starting
              </>
            ) : (
              <>
                Analyze channel
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
