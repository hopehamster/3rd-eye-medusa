"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import OracleChat from "@modules/oracle/components/oracle-chat"
import OracleQuiz from "@modules/oracle/components/oracle-quiz"

export default function OracleExperience({
  countryCode,
  initialAbout,
  isSignedIn,
}: {
  countryCode: string
  initialAbout?: string
  isSignedIn: boolean
}) {
  const [mode, setMode] = useState<"chat" | "quiz">("chat")
  const [quizQuestion, setQuizQuestion] = useState<string | undefined>(
    initialAbout
  )
  const [chatKey, setChatKey] = useState(0)

  const handleQuizComplete = (compiled: string) => {
    setQuizQuestion(compiled)
    setChatKey((k) => k + 1)
    setMode("chat")
  }

  return (
    <div className="bg-paper-bg paper-grain text-paper-text">
      <div className="relative z-[2] mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10 max-w-2xl">
          <h1 className="font-display text-4xl small:text-5xl font-light tracking-tight text-paper-text mb-4">
            Ask the Oracle
          </h1>
          <p className="font-humanist text-paper-muted leading-7">
            Describe what you need in your own words — or take the guided quiz
            and let the Oracle read between the lines. Four guides keep the
            counter here, each with a different way of seeing.
          </p>
          {isSignedIn ? (
            <div
              className="mt-8 flex gap-8 border-b border-paper-border"
              role="tablist"
              aria-label="Oracle consultation style"
            >
              {(["chat", "quiz"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={`-mb-px border-b-2 pb-3 font-humanist text-sm transition-colors ${
                    mode === m
                      ? "border-paper-accent font-semibold text-paper-accent"
                      : "border-transparent text-paper-muted hover:text-paper-text"
                  }`}
                >
                  {m === "chat" ? "Ask freely" : "Guided quiz"}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {!isSignedIn ? (
          <div className="specimen-card max-w-xl p-6 small:p-8">
            <p className="font-display text-xl text-paper-text">
              The Oracle is kept for members
            </p>
            <p className="mt-3 font-humanist text-[15px] leading-7 text-paper-muted">
              Readings are saved to your account so you can return to them, and
              so each one can pick up where the last left off. Sign in — or make
              an account in a few seconds — and the counter opens.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <LocalizedClientLink
                href="/account"
                className="border border-paper-accent bg-paper-accent px-5 py-2.5 font-humanist text-sm font-semibold text-paper-bg transition-opacity hover:opacity-90"
              >
                Sign in
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/account"
                className="font-humanist text-sm text-paper-muted underline underline-offset-4 transition-colors hover:text-paper-accent"
              >
                Create an account
              </LocalizedClientLink>
            </div>
          </div>
        ) : mode === "quiz" ? (
          <OracleQuiz onComplete={handleQuizComplete} />
        ) : (
          <OracleChat
            key={chatKey}
            countryCode={countryCode}
            initialQuestion={quizQuestion}
          />
        )}
      </div>
    </div>
  )
}
