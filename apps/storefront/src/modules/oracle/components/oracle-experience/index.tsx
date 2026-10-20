"use client"

import { useState } from "react"
import OracleChat from "@modules/oracle/components/oracle-chat"
import OracleQuiz from "@modules/oracle/components/oracle-quiz"

export default function OracleExperience({
  countryCode,
  initialAbout,
}: {
  countryCode: string
  initialAbout?: string
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
        </div>

        {mode === "quiz" ? (
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
