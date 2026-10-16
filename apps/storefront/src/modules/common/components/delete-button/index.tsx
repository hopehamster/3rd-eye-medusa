import { Spinner, Trash } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import { useState } from "react"

const DeleteButton = ({
  id,
  children,
  className,
  "data-testid": dataTestId,
}: {
  id: string
  children?: React.ReactNode
  className?: string
  "data-testid"?: string
}) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      // Direct client-side fetch (server action has issues)
      const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
      const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      
      // Get cart ID from cookie
      const cartId = document.cookie
        .split('; ')
        .find(row => row.startsWith('_medusa_cart_id='))
        ?.split('=')[1]
      
      if (!cartId) {
        throw new Error("No cart found")
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
      
      // Refresh the page to show updated cart
      window.location.reload()
    } catch (err) {
      console.error("Delete failed:", err)
      setIsDeleting(false)
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
