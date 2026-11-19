import { Spinner, Trash } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import { useState } from "react"

const DeleteButton = ({
  id,
  cartId,
  children,
  className,
  onDeleteStart,
  onDeleteError,
  removeDelayMs = 0,
  "data-testid": dataTestId,
}: {
  id: string
  cartId?: string
  children?: React.ReactNode
  className?: string
  // Called when the delete starts, so the row can play its exit animation.
  onDeleteStart?: () => void
  // Called if the delete fails, so the row can snap back.
  onDeleteError?: () => void
  // Milliseconds to wait after a successful delete before reloading, so
  // the row's exit animation is visible. Defaults to 0 (reload at once).
  removeDelayMs?: number
  "data-testid"?: string
}) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    onDeleteStart?.()
    try {
      // Direct client-side fetch (server action has issues)
      const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
      const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      
      if (!cartId) {
        throw new Error("No cart ID provided")
      }
      
      const res = await fetch(
        `${backendUrl}/store/carts/${cartId}/line-items/${id}`,
        {
          method: "DELETE",
          headers: {
            "x-publishable-api-key": publishableKey || "",
            "Content-Type": "application/json",
          },
        }
      )
      
      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status}`)
      }
      
      // Wait out the row's exit animation before the reload removes it.
      if (removeDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, removeDelayMs))
      }

      // Refresh the page to show updated cart
      window.location.reload()
    } catch (err) {
      setIsDeleting(false)
      onDeleteError?.()
    }
  }

  return (
    <div
      className={clx(
        "flex items-center justify-between text-small-regular",
        className
      )}
    >
      <button
        className="flex gap-x-1 text-ui-fg-subtle hover:text-ui-fg-base cursor-pointer"
        onClick={() => handleDelete(id)}
        data-testid={dataTestId}
      >
        {isDeleting ? <Spinner className="animate-spin" /> : <Trash />}
        <span>{children}</span>
      </button>
    </div>
  )
}

export default DeleteButton
