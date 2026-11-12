"use client"

import { IconBadge, clx } from "@modules/common/components/ui"
import { motion, useAnimationControls, useReducedMotion } from "framer-motion"
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
    // it. The pop is driven by animation controls, not a remount key, so
    // the <select> node survives the quantity change and keeps keyboard
    // focus. The pop only fires when the value actually changes after
    // mount, so the cart page loading does not pop every line item.
    // Reduced-motion visitors get neither the animation nor any DOM churn.
    const prevValue = useRef(value)
    const controls = useAnimationControls()

    useEffect(() => {
      if (prevValue.current !== value) {
        prevValue.current = value
        if (!shouldReduceMotion) {
          controls.start({
            scale: [1.12, 1],
            transition: { duration: 0.25, ease: "easeOut" },
          })
        }
      }
    }, [value, shouldReduceMotion, controls])

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
      <motion.div animate={controls}>
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
