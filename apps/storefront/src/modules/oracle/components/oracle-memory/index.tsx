"use client"

import { useCallback, useEffect, useState } from "react"
import { sdk } from "@lib/config"

/**
 * "What the Oracle remembers" (#137).
 *
 * The backend only writes a profile when the customer has explicitly opted in,
 * and exposes GET / POST / DELETE /store/oracle/profile. This is the control
 * that lets a member turn it on, read it, and forget it.
 *
 * Guests get 401 from the profile route, which is the signal to render nothing —
 * a signed-out visitor has no memory to manage.
 */
type Profile = { expert_id: string; profile: Record<string, unknown> }

const LABELS: Record<string, string> = {
  favorite_stone: "Stone you keep coming back to",
  metal_preference: "Metal you prefer",
  keeps_stone_by_bed: "Keeps a stone by the bed",
  intentions: "What you are working on",
  aesthetic_preference: "The kind of thing you like",
  updated_at: "Last updated",
}

const pretty = (key: string) => LABELS[key] ?? key.replace(/_/g, " ")

const showValue = (value: unknown) => {
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "string") return value
  if (Array.isArray(value)) return value.join(", ")
  return JSON.stringify(value)
}

const OracleMemory = () => {
  const [state, setState] = useState<"hidden" | "loading" | "ready">("loading")
  const [consent, setConsent] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await sdk.client.fetch<{
        consent: boolean
        profiles: Profile[]
      }>("/store/oracle/profile", { method: "GET" })
      setConsent(!!res.consent)
      setProfiles(res.profiles ?? [])
      setState("ready")
    } catch {
      // 401 for guests, or the route is unavailable — stay out of the way.
      setState("hidden")
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setRemembering = async (next: boolean) => {
    setBusy(true)
    setError(null)
    try {
      await sdk.client.fetch("/store/oracle/profile", {
        method: "POST",
        body: { consent: next },
      })
      setConsent(next)
      if (!next) setProfiles([])
      else await load()
    } catch {
      setError("That did not save. Try again in a moment.")
    } finally {
      setBusy(false)
    }
  }

  const forget = async () => {
    setBusy(true)
    setError(null)
    try {
      await sdk.client.fetch("/store/oracle/profile", { method: "DELETE" })
      setProfiles([])
      setConsent(false)
    } catch {
      setError("That did not go through. Try again in a moment.")
    } finally {
      setBusy(false)
    }
  }

  if (state === "hidden") return null
  if (state === "loading") return null

  const rows = profiles.flatMap((p) =>
    Object.entries(p.profile ?? {}).filter(([key]) => key !== "updated_at" && key !== "updatedAt")
  )

  return (
    <section className="border-t border-paper-borderSoft bg-paper-surface paper-grain text-paper-text">
      <div className="content-container relative z-[2] py-12 small:py-16">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-light tracking-tight">
            What the Oracle remembers about you
          </h2>

          <p className="mt-4 font-humanist text-base leading-7 text-paper-muted">
            Off by default. Turn it on and the Oracle keeps a short note of what
            you tell it — the stones you keep coming back to, what you are
            dealing with — so you do not have to repeat yourself. It is yours:
            you can read it here and delete it whenever you want.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setRemembering(!consent)}
              disabled={busy}
              className={[
                "inline-flex items-center justify-center px-5 py-2.5 font-humanist text-sm font-semibold transition-colors",
                consent
                  ? "border border-paper-border text-paper-text hover:border-paper-accent hover:text-paper-accent"
                  : "bg-paper-accent text-paper-raised hover:bg-paper-accentBright",
                busy ? "opacity-60" : "",
              ].join(" ")}
            >
              {consent ? "Stop remembering me" : "Let the Oracle remember me"}
            </button>

            {rows.length > 0 && (
              <button
                type="button"
                onClick={forget}
                disabled={busy}
                className="font-humanist text-sm text-paper-muted underline underline-offset-4 hover:text-paper-accent"
              >
                Forget everything
              </button>
            )}
          </div>

          {error && (
            <p className="mt-3 font-humanist text-sm text-paper-muted">{error}</p>
          )}

          {rows.length > 0 && (
            <dl className="mt-8 grid grid-cols-1 gap-x-10 gap-y-3 small:grid-cols-2">
              {rows.map(([key, value]) => (
                <div key={key} className="flex flex-col border-b border-paper-borderSoft pb-2">
                  <dt className="font-humanist text-xs uppercase tracking-wide text-paper-muted">
                    {pretty(key)}
                  </dt>
                  <dd className="font-humanist text-base text-paper-text">
                    {showValue(value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {consent && rows.length === 0 && (
            <p className="mt-6 font-humanist text-sm text-paper-muted">
              Nothing written down yet. Ask the Oracle something and it will
              keep the parts worth keeping.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default OracleMemory
