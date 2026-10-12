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
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-widest text-violet-400 mb-2">
          3rd Eye Supply
        </p>
        <h1 className="text-3xl font-semibold mb-3">The Oracle</h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm">
          Describe what you need in your own words — or take the guided quiz
          and let the Oracle read between the lines.
        </p>
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.02] p-1 mt-6">
          {(["chat", "quiz"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-5 py-1.5 text-sm transition ${
                mode === m
                  ? "bg-violet-600 text-white"
                  : "text-gray-400 hover:text-white"
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
  )
}
