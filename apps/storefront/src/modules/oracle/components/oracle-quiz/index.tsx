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
      <div className="mb-8 flex gap-2" aria-hidden="true">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`h-[3px] flex-1 rounded-none ${
              i <= step ? "bg-paper-accent" : "bg-paper-borderSoft"
            }`}
          />
        ))}
      </div>

      <h2 className="mb-2 font-display text-3xl font-light text-paper-text">
        {question.question}
      </h2>
      <p className="mb-6 font-humanist text-sm text-paper-faint">
        Question {step + 1} of {QUESTIONS.length}
      </p>

      <div className="grid gap-3">
        {question.options.map((option) => (
          <button
            key={option.label}
            onClick={() => choose(option)}
            className="specimen-card w-full p-4 text-left transition-colors hover:border-paper-accent"
          >
            <span className="block font-humanist font-medium text-paper-text">
              {option.label}
            </span>
            {option.hint && (
              <span className="specimen-meta mt-1 block">{option.hint}</span>
            )}
          </button>
        ))}
      </div>

      {isLast && (
        <div className="mt-6">
          <label
            htmlFor="oracle-quiz-custom"
            className="mb-2 block font-humanist text-sm text-paper-muted"
          >
            Anything else on your mind? (optional)
          </label>
          <textarea
            id="oracle-quiz-custom"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full rounded-soft border border-paper-border bg-paper-raised p-3 font-humanist text-sm text-paper-text placeholder:text-paper-faint focus:border-paper-accent focus:outline-none"
            rows={2}
            placeholder="Tell the Oracle anything else..."
          />
        </div>
      )}

      <div className="mt-6 flex items-baseline justify-between">
        <button
          onClick={back}
          disabled={step === 0}
          className="font-humanist text-sm text-paper-muted underline-offset-4 transition-colors hover:text-paper-accent hover:underline disabled:opacity-40"
        >
          Back
        </button>
        <span className="font-humanist text-xs text-paper-faint">
          Your answers shape the Oracle&apos;s guidance
        </span>
      </div>
    </div>
  )
}
