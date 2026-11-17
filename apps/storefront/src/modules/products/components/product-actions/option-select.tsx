import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  // Dedupe values so a repeated option value renders one button, not two.
  // Only values the product actually has are rendered; nothing is invented.
  const filteredOptions = Array.from(
    new Set((option.values ?? []).map((v) => v.value))
  )

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm font-humanist text-paper-text">Select {title}</span>
      <div
        className="flex flex-wrap justify-between gap-2"
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          return (
            <button
              type="button"
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "bg-paper-raised border-paper-border text-paper-muted border text-[12px] font-medium px-3 py-1.5 h-10 rounded-specimen flex-1 transition-colors",
                {
                  "bg-paper-accentSoft border-paper-accent text-paper-accent font-semibold":
                    v === current,
                  "hover:border-paper-text": v !== current,
                }
              )}
              disabled={disabled}
              aria-pressed={v === current}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
