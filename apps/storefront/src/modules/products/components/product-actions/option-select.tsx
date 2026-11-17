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

  // Fix 6 (issue #312): a lone "Default" value is Medusa's placeholder
  // for a product with no real variants — suppress the selector
  // entirely instead of rendering it as a pill. A "Default" value
  // alongside real values, and any real value on its own, still renders.
  if (
    filteredOptions.length === 1 &&
    filteredOptions[0].toLowerCase() === "default"
  ) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm">Select {title}</span>
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
                "bg-[#FFFDF7] border border-[#D9CFBB] text-[#23201B] text-small-regular h-10 rounded-[3px] p-2 flex-1",
                {
                  "shadow-[inset_0_0_0_1px_#23201B]": v === current,
                  "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150":
                    v !== current,
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
