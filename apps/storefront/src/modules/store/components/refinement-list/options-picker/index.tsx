"use client"

import * as Accordion from "@radix-ui/react-accordion"
import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"

import { ChevronDownMini } from "@medusajs/icons"
import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import clsx from "clsx"

type OptionsPickerProps = {
  selectedValueIds: string[]
  setOptionValueIds: (valueIds: string[]) => void
}

const OptionsPicker = ({
  selectedValueIds,
  setOptionValueIds,
}: OptionsPickerProps) => {
  const [options, setOptions] = useState<HttpTypes.StoreProductOption[]>([])
  const [openItems, setOpenItems] = useState<string[]>([])
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await sdk.client.fetch<{
          product_options?: HttpTypes.StoreProductOption[]
        }>("/store/product-options", {
          method: "GET",
          query: {
            is_exclusive: false,
            fields: "*values",
          },
        })

        if (response?.product_options) {
          setOptions(response.product_options)
        }
      } catch (error) {
        console.error("Failed to fetch product options", error)
      }
    }

    fetchOptions()
  }, [])

  useEffect(() => {
    if (options.length) {
      setOpenItems(options.map((option) => option.id))
    }
  }, [options])

  if (!options.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="txt-compact-small-plus text-ui-fg-subtle">
          Options
        </span>
      </div>
      <Accordion.Root
        type="multiple"
        value={openItems}
        onValueChange={(values) => setOpenItems(values as string[])}
        className="flex flex-col gap-y-3 pr-6"
      >
        {options.map((option) => {
          const values =
            option.values
              ?.map((value) => ({
                id: value.id,
                label: value.value,
              }))
              .filter(
                (value): value is { id: string; label: string } =>
                  !!value.id && !!value.label
              ) || []

          if (!values.length) {
            return null
          }

          const toggleValue = (valueId: string) => {
            const isSelected = selectedValueIds.includes(valueId)
            const nextSelections = isSelected
              ? selectedValueIds.filter((id) => id !== valueId)
              : [...selectedValueIds, valueId]

            setOptionValueIds(Array.from(new Set(nextSelections)))
          }

          const isOpen = openItems.includes(option.id)
          const selectedCount = values.filter((value) =>
            selectedValueIds.includes(value.id)
          ).length

          return (
            <Accordion.Item
              key={option.id}
              value={option.id}
              className="overflow-hidden"
            >
              <Accordion.Header>
                <Accordion.Trigger className="flex w-full items-center justify-between py-3 text-left">
                  <div className="flex items-center gap-2">
                    <span className="txt-compact-small-plus text-ui-fg-base">
                      {option.title || "Option"}
                    </span>
                    <span className="txt-compact-small-plus text-ui-fg-muted">
                      ({selectedCount})
                    </span>
                  </div>
                  <span
                    className={clsx(
                      "flex h-7 w-7 items-center justify-center text-ui-fg-muted transition-transform duration-150",
                      {
                        "rotate-180": isOpen,
                      }
                    )}
                  >
                    <ChevronDownMini />
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="pb-4 pt-1">
                <div className="flex flex-wrap gap-2">
                  {values.map((value) => {
                    const isSelected = selectedValueIds.includes(value.id)

                    return (
                      <button
                        key={value.id}
                        onClick={() => toggleValue(value.id)}
                        className={clsx(
                          "border-ui-border-base border text-small-regular h-10 rounded-rounded px-3 flex items-center relative overflow-hidden transition-colors duration-150",
                          {
                            "border-ui-border-interactive text-ui-fg-base":
                              isSelected,
                            "text-ui-fg-muted hover:text-ui-fg-base":
                              !isSelected,
                          }
                        )}
                        aria-pressed={isSelected}
                      >
                        {/*
                         * Pill fill (issue #218): the selected pill's
                         * background sweeps across from the left instead of
                         * snapping its colour. A fill layer scales in from
                         * scaleX 0 to 1 on select and back out on deselect,
                         * 0.35s, quiet. Reduced motion: no sweep, the fill
                         * appears instantly (duration 0, plus the
                         * MotionConfig reducedMotion="user" guard in the
                         * parent RefinementList).
                         */}
                        <motion.span
                          aria-hidden="true"
                          className="absolute inset-0 bg-ui-bg-base-hover"
                          initial={false}
                          animate={{ scaleX: isSelected ? 1 : 0 }}
                          style={{ transformOrigin: "left center" }}
                          transition={{
                            duration: prefersReducedMotion ? 0 : 0.35,
                            ease: "easeOut",
                          }}
                        />
                        <span className="relative z-[1]">
                          {value.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          )
        })}
      </Accordion.Root>
    </div>
  )
}

export default OptionsPicker
