"use client"

import { useEffect } from "react"

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("PDP error:", error.message, error.stack)
  }, [error])

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Product page error (debug)</h1>
      <p><strong>Message:</strong> {error.message}</p>
      {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}
      <pre style={{ whiteSpace: "pre-wrap", background: "#f5f5f5", padding: "1rem", overflow: "auto" }}>
        {error.stack}
      </pre>
      <button onClick={() => reset()} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
        Try again
      </button>
    </div>
  )
}
