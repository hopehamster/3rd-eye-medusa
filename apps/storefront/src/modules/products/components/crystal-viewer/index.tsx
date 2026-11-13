"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion"
import { getStoneProfile } from "./stone-profile"

/**
 * PDP 3D stone study. Rendered as the first specimen plate in the gallery:
 * the stone itself, floating and turning, drag-to-rotate.
 *
 * Honest by construction: the caption names the stone (not the bracelet),
 * and anything without WebGL — or any runtime failure — falls back to the
 * product's own first photo. The three.js chunk loads lazily (ssr: false)
 * so it never touches the initial page payload.
 */

const CrystalScene = dynamic(() => import("./CrystalScene"), {
  ssr: false,
  loading: () => <ViewerShimmer />,
})

function ViewerShimmer() {
  return (
    <div className="absolute inset-0 bg-paper-raised">
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="font-humanist text-sm tracking-wide text-paper-muted">
          Preparing the stone&hellip;
        </p>
      </div>
    </div>
  )
}

class ViewerErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function useWebGLAvailable() {
  const [available, setAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    let ok = false
    try {
      const canvas = document.createElement("canvas")
      ok = !!(
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")
      )
    } catch {
      ok = false
    }
    setAvailable(ok)
  }, [])

  return available
}

type CrystalViewerProps = {
  title: string
  handle: string
  fallbackImage?: { id: string; url: string | null }
}

/**
 * Pointer tilt (issue #228): how far the stone leans toward the pointer,
 * in radians. Small on purpose — a glance, not a swing.
 */
const MAX_TILT_X = 0.1
const MAX_TILT_Y = 0.12

const CrystalViewer = ({ title, handle, fallbackImage }: CrystalViewerProps) => {
  const webgl = useWebGLAvailable()
  const profile = getStoneProfile(title, handle)
  const prefersReducedMotion = useReducedMotion()

  // The tilt itself lives in two sprung motion values (Framer Motion):
  // the pointer sets a target, the spring eases the stone there and back
  // in ~0.4s. The values are read once per frame inside the Canvas
  // (CrystalScene), so pointer moves never re-render the viewer.
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const tiltX = useSpring(rotateX, { stiffness: 140, damping: 18, mass: 0.4 })
  const tiltY = useSpring(rotateY, { stiffness: 140, damping: 18, mass: 0.4 })
  const draggingRef = useRef(false)

  // While the visitor drags, OrbitControls owns the stone: the tilt
  // eases back to level and pointer moves are ignored until release.
  const handleDragChange = useCallback(
    (dragging: boolean) => {
      draggingRef.current = dragging
      if (dragging) {
        rotateX.set(0)
        rotateY.set(0)
      }
    },
    [rotateX, rotateY]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (prefersReducedMotion || draggingRef.current) return
      if (event.pointerType === "touch") return
      const rect = event.currentTarget.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const nx = Math.max(
        -1,
        Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1)
      )
      const ny = Math.max(
        -1,
        Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1)
      )
      rotateY.set(nx * MAX_TILT_Y)
      rotateX.set(-ny * MAX_TILT_X)
    },
    [prefersReducedMotion, rotateX, rotateY]
  )

  const handlePointerLeave = useCallback(() => {
    rotateX.set(0)
    rotateY.set(0)
  }, [rotateX, rotateY])

  const photoFallback = (
    <div className="relative h-full w-full">
      {!!fallbackImage?.url && (
        <Image
          src={fallbackImage.url}
          alt={title}
          fill
          className="absolute inset-0"
          style={{ objectFit: "cover" }}
        />
      )}
    </div>
  )

  return (
    <figure
      className="relative aspect-[29/34] w-full overflow-hidden bg-paper-surface border border-paper-borderSoft rounded-specimen"
      data-testid="crystal-viewer"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {webgl === null ? (
        <ViewerShimmer />
      ) : webgl === false ? (
        photoFallback
      ) : (
        <ViewerErrorBoundary fallback={photoFallback}>
          <Suspense fallback={<ViewerShimmer />}>
            <CrystalScene
              profile={profile}
              tiltX={tiltX}
              tiltY={tiltY}
              onDragChange={handleDragChange}
            />
          </Suspense>
        </ViewerErrorBoundary>
      )}
      <figcaption className="pointer-events-none absolute bottom-3 left-0 right-0 text-center">
        <span className="inline-block rounded-full border border-paper-borderSoft bg-paper-bg/85 px-3 py-1 font-humanist text-xs tracking-wide text-paper-muted">
          {profile.name} &mdash; the stone in 3D &middot; drag to turn
        </span>
      </figcaption>
    </figure>
  )
}

export default CrystalViewer
