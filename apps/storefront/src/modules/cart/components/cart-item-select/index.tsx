"use client"

import { IconBadge, clx } from "@modules/common/components/ui"
import { motion, useReducedMotion } from "framer-motion"
import {
  SelectHTMLAttributes,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

import ChevronDown from "@modules/common/icons/chevron-down"

type NativeSelectProps = {
  placeholder?: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">

const CartItemSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  (
    { placeholder = "Select...", className, children, value, ...props },
    ref
  ) => {
    const innerRef = useRef<HTMLSelectElement>(null)
    const [isPlaceholder, setIsPlaceholder] = useState(false)
    const shouldReduceMotion = useReducedMotion()

    // The quantity is shown by a native <select>, so the pop animates the
    // whole control (which displays the number) instead of the text inside
    // it. popKey only advances when the value actually changes after mount,
    // so the cart page loading does not pop every line item.
    const prevValue = useRef(value)
    const [popKey, setPopKey] = useState(0)

    useEffect(() => {
      if (prevValue.current !== value) {
        prevValue.current = value
        setPopKey((k) => k + 1)
      }
    }, [value])

    useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
      ref,
      () => innerRef.current
    )

    useEffect(() => {
      if (innerRef.current && innerRef.current.value === "") {
        setIsPlaceholder(true)
      } else {
        setIsPlaceholder(false)
      }
    }, [innerRef.current?.value])

    return (
      <motion.div
        key={popKey}
        initial={{ scale: popKey === 0 || shouldReduceMotion ? 1 : 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <IconBadge
          onFocus={() => innerRef.current?.focus()}
          onBlur={() => innerRef.current?.blur()}
          className={clx(
            "relative flex items-center txt-compact-small border text-ui-fg-base group",
            className,
            {
              "text-ui-fg-subtle": isPlaceholder,
            }
          )}
        >
          <select
            ref={innerRef}
            value={value}
            {...props}
            className="appearance-none bg-transparent border-none px-4 transition-colors duration-150 focus:border-gray-700 outline-none w-16 h-16 items-center justify-center"
          >
            <option disabled value="">
              {placeholder}
            </option>
            {children}
          </select>
          <span className="absolute flex pointer-events-none justify-end w-8 group-hover:animate-pulse">
            <ChevronDown />
          </span>
        </IconBadge>
      </motion.div>
    )
  }
)

CartItemSelect.displayName = "CartItemSelect"

export default CartItemSelect
