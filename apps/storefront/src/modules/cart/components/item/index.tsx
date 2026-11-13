"use client"

import { Table, Text, clx } from "@modules/common/components/ui"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { motion, useReducedMotion } from "framer-motion"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

// Exit animation length for a removed row. Under the half-second house cap.
const EXIT_MS = 350

// The row itself is a <tr>, which does not take CSS transforms reliably,
// so the slide runs on each cell's contents (all in lockstep, so the row
// reads as one piece sliding left) while the row fades out.
const CellContent = ({
  exiting,
  children,
}: {
  exiting: boolean
  children: React.ReactNode
}) => (
  <motion.div
    animate={{ x: exiting ? -48 : 0 }}
    transition={{ duration: EXIT_MS / 1000, ease: "easeIn" }}
  >
    {children}
  </motion.div>
)

const MotionRow = motion(Table.Row)

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
  cartId?: string
}

const Item = ({ item, type = "full", currencyCode, cartId }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  // With reduced motion there is no exit animation: the row disappears
  // on the reload with no slide, no fade, and no delay.
  const exiting = removing && !prefersReducedMotion

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  // TODO: Update this to grab the actual max inventory
  const maxQtyFromInventory = 10
  const maxQuantity = item.variant?.manage_inventory ? 10 : maxQtyFromInventory

  return (
    <MotionRow
      className="w-full"
      data-testid="product-row"
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: EXIT_MS / 1000, ease: "easeIn" }}
    >
      <Table.Cell className="!pl-0 p-4 w-24">
        <CellContent exiting={exiting}>
          <LocalizedClientLink
            href={`/products/${item.product_handle}`}
            className={clx("flex", {
              "w-16": type === "preview",
              "small:w-24 w-12": type === "full",
            })}
          >
            <Thumbnail
              thumbnail={item.thumbnail}
              images={item.variant?.product?.images}
              size="square"
            />
          </LocalizedClientLink>
        </CellContent>
      </Table.Cell>

      <Table.Cell className="text-left">
        <CellContent exiting={exiting}>
          <Text
            className="txt-medium-plus text-ui-fg-base"
            data-testid="product-title"
          >
            {item.product_title}
          </Text>
          <LineItemOptions variant={item.variant} data-testid="product-variant" />
        </CellContent>
      </Table.Cell>

      {type === "full" && (
        <Table.Cell>
          <CellContent exiting={exiting}>
            <div className="flex gap-2 items-center w-28">
              <DeleteButton
                id={item.id}
                cartId={cartId}
                data-testid="product-delete-button"
                onDeleteStart={() => setRemoving(true)}
                onDeleteError={() => setRemoving(false)}
                removeDelayMs={prefersReducedMotion ? 0 : EXIT_MS}
              />
              <CartItemSelect
                value={item.quantity}
                onChange={(value) => changeQuantity(parseInt(value.target.value))}
                className="w-14 h-10 p-4"
                data-testid="product-select-button"
              >
                {/* TODO: Update this with the v2 way of managing inventory */}
                {Array.from(
                  {
                    length: Math.min(maxQuantity, 10),
                  },
                  (_, i) => (
                    <option value={i + 1} key={i}>
                      {i + 1}
                    </option>
                  )
                )}

                <option value={1} key={1}>
                  1
                </option>
              </CartItemSelect>
              {updating && <Spinner />}
            </div>
            <ErrorMessage error={error} data-testid="product-error-message" />
          </CellContent>
        </Table.Cell>
      )}

      {type === "full" && (
        <Table.Cell className="hidden small:table-cell">
          <CellContent exiting={exiting}>
            <LineItemUnitPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
            />
          </CellContent>
        </Table.Cell>
      )}

      <Table.Cell className="!pr-0">
        <CellContent exiting={exiting}>
          <span
            className={clx("!pr-0", {
              "flex flex-col items-end h-full justify-center": type === "preview",
            })}
          >
            {type === "preview" && (
              <span className="flex gap-x-1 ">
                <Text className="text-ui-fg-muted">{item.quantity}x </Text>
                <LineItemUnitPrice
                  item={item}
                  style="tight"
                  currencyCode={currencyCode}
                />
              </span>
            )}
            <LineItemPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
            />
          </span>
        </CellContent>
      </Table.Cell>
    </MotionRow>
  )
}

export default Item
