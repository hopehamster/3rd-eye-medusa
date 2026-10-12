"use client"

import { useState } from "react"

interface QuizOption {
  label: string
  hint?: string
  intents: string[]
  freeText?: string
}

interface QuizQuestion {
  id: string
  question: string
  options: QuizOption[]
  allowCustom?: boolean
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "need",
    question: "What brings you to the Oracle tonight?",
    options: [
      {
        label: "I need protection",
        hint: "for my home, my energy, my travels",
        intents: ["protection"],
        freeText: "I need protection",
      },
      {
        label: "I feel scattered",
        hint: "too much noise, can't focus",
        intents: ["grounding", "clarity-focus"],
        freeText: "I've been feeling scattered and unfocused",
      },
      {
        label: "I can't sleep well",
        hint: "restless nights, vivid dreams",
        intents: ["sleep-dreams", "calm-soothing"],
        freeText: "I want to sleep better",
      },
      {
        label: "I want more abundance",
        hint: "prosperity, opportunity, flow",
        intents: ["abundance-prosperity"],
        freeText: "I want to attract abundance",
      },
      {
        label: "Matters of the heart",
        hint: "love, self-worth, relationships",
        intents: ["love-self", "love-romantic"],
        freeText: "I'm thinking about love and relationships",
      },
      {
        label: "I'm grieving",
        hint: "loss, heavy heart",
        intents: ["grief-healing", "calm-soothing"],
        freeText: "I'm going through grief and need comfort",
      },
    ],
  },
  {
    id: "feeling",
    question: "How do you want to feel?",
    options: [
      {
        label: "Grounded",
        hint: "steady, rooted, calm",
        intents: ["grounding"],
        freeText: "grounded and steady",
      },
      {
        label: "Energized",
        hint: "alive, motivated, clear",
        intents: ["energy-chakra-balancing", "confidence-courage"],
        freeText: "energized and motivated",
      },
      {
        label: "Peaceful",
        hint: "soft, held, at ease",
        intents: ["calm-soothing"],
        freeText: "peaceful and at ease",
      },
      {
        label: "Connected",
        hint: "to spirit, to ritual, to meaning",
        intents: ["spiritual-connection-ritual", "intuition-third-eye"],
        freeText: "spiritually connected",
      },
      {
        label: "Inspired",
        hint: "creative, open, flowing",
        intents: ["creativity-inspiration"],
        freeText: "creative and inspired",
      },
      {
        label: "Brave",
        hint: "confident, willing to begin",
        intents: ["confidence-courage"],
        freeText: "brave and confident",
      },
    ],
  },
  {
    id: "place",
    question: "Where will this live?",
    options: [
      {
        label: "My home",
        hint: "a room, an altar, the entryway",
        intents: ["cleansing-purification"],
        freeText: "for my home",
      },
      {
        label: "With me",
        hint: "carried, worn, in a pocket",
        intents: ["protection"],
        freeText: "something I can carry with me",
      },
      {
        label: "My practice",
        hint: "meditation, ritual, altar work",
        intents: ["spiritual-connection-ritual"],
        freeText: "for my spiritual practice and rituals",
      },
      {
        label: "As a gift",
        hint: "for someone I care about",
        intents: ["love-self"],
        freeText: "as a gift for someone I care about",
      },
    ],
  },
  {
    id: "stone",
    question: "Which stone calls to you?",
    options: [
      {
        label: "Amethyst",
        hint: "calm, intuition, sleep",
        intents: ["calm-soothing", "intuition-third-eye", "sleep-dreams"],
        freeText: "I'm drawn to amethyst",
      },
      {
        label: "Rose Quartz",
        hint: "love, gentleness, self-worth",
        intents: ["love-self", "love-romantic"],
        freeText: "I'm drawn to rose quartz",
      },
      {
        label: "Black Tourmaline",
        hint: "protection, grounding",
        intents: ["protection", "grounding"],
        freeText: "I'm drawn to black tourmaline",
      },
      {
        label: "Citrine",
        hint: "abundance, joy, energy",
        intents: ["abundance-prosperity", "energy-chakra-balancing"],
        freeText: "I'm drawn to citrine",
      },
      {
        label: "Clear Quartz",
        hint: "clarity, amplification",
        intents: ["clarity-focus", "intuition-third-eye"],
        freeText: "I'm drawn to clear quartz",
      },
      {
        label: "Not sure",
        hint: "surprise me",
        intents: [],
        freeText: "",
      },
    ],
  },
]

interface OracleQuizProps {
  onComplete: (compiledQuestion: string) => void
}

export default function OracleQuiz({ onComplete }: OracleQuizProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<QuizOption[]>([])
  const [customText, setCustomText] = useState("")

  const question = QUESTIONS[step]
  const isLast = step === QUESTIONS.length - 1

  const choose = (option: QuizOption) => {
    const next = [...answers, option]
    setAnswers(next)
    if (isLast) {
      finish(next, customText)
    } else {
      setStep(step + 1)
    }
  }

  const finish = (finalAnswers: QuizOption[], custom: string) => {
    const fragments = finalAnswers
      .map((a) => a.freeText)
      .filter(Boolean)
    if (custom.trim()) {
      fragments.push(custom.trim())
    }
    const compiled = fragments.length
      ? `${fragments.join(". ")}.`
      : "Guide me — I'm not sure what I need."
    onComplete(compiled)
  }

  const back = () => {
    if (step > 0) {
      setStep(step - 1)
      setAnswers(answers.slice(0, -1))
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i <= step ? "bg-violet-500" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      <h2 className="text-2xl font-semibold mb-2">{question.question}</h2>
      <p className="text-sm text-gray-400 mb-6">
        Question {step + 1} of {QUESTIONS.length}
      </p>

      <div className="grid gap-3">
        {question.options.map((option) => (
          <button
            key={option.label}
            onClick={() => choose(option)}
            className="text-left rounded-lg border border-white/10 bg-white/[0.02] p-4 hover:border-violet-600/60 hover:bg-violet-950/30 transition"
          >
            <span className="font-medium">{option.label}</span>
            {option.hint && (
              <span className="block text-sm text-gray-400 mt-1">
                {option.hint}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLast && (
        <div className="mt-6">
          <label className="block text-sm text-gray-400 mb-2">
            Anything else on your mind? (optional)
          </label>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm"
            rows={2}
            placeholder="Tell the Oracle anything else..."
          />
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <button
          onClick={back}
          disabled={step === 0}
          className="text-sm text-gray-400 hover:text-white disabled:opacity-30"
        >
          Back
        </button>
        <span className="text-xs text-gray-500">
          Your answers shape the Oracle&apos;s guidance
        </span>
      </div>
    </div>
  )
}
