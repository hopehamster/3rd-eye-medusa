"use client"

import { useRef, useState } from "react"

/**
 * Gold spotlight card — cursor-tracking radial light with border glow.
 * Clean-room implementation of the spotlight pattern.
 */
const SpotlightCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: -400, y: -400 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`group/spot relative overflow-hidden ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px z-10 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(480px circle at ${position.x}px ${position.y}px, rgba(200,150,60,0.14), transparent 45%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: opacity * 0.6,
          boxShadow: `inset 0 0 0 1px rgba(200,150,60,0.25)`,
          maskImage: `radial-gradient(480px circle at ${position.x}px ${position.y}px, black, transparent 45%)`,
          WebkitMaskImage: `radial-gradient(480px circle at ${position.x}px ${position.y}px, black, transparent 45%)`,
        }}
      />
      {children}
    </div>
  )
}

export default SpotlightCard
