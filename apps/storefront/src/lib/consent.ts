/**
 * Cookie/analytics consent, stored client-side.
 *
 * We keep this deliberately small: one decision (analytics allowed or not),
 * persisted in localStorage, read once at boot. Nothing non-essential runs
 * before the visitor chooses, which is what the privacy policy promises.
 */

export const CONSENT_STORAGE_KEY = "3es_analytics_consent"
export const CONSENT_CHANGED_EVENT = "3es:consent-changed"

export type ConsentValue = "granted" | "denied"

/** Returns the stored decision, or null when the visitor has not chosen yet. */
export function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") {
    return null
  }
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    return raw === "granted" || raw === "denied" ? raw : null
  } catch {
    // storage blocked (private mode, cookie blocker) — treat as undecided
    return null
  }
}

export function writeConsent(value: ConsentValue): void {
  if (typeof window === "undefined") {
    return
  }
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value)
  } catch {
    // nothing to do; the banner will appear again next visit
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: value }))
}

/** Escape hatch for the footer/privacy page: forget the choice and re-ask. */
export function clearConsent(): void {
  if (typeof window === "undefined") {
    return
  }
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY)
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: null }))
}
