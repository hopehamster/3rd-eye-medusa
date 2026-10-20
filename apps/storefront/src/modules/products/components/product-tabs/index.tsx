"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

/**
 * Below-the-fold details for the PDP (issue #24).
 * Spec rows moved into the specimen-label panel; this keeps shipping and
 * returns only. Copy is honest for this store (CJ dropshipping): pieces ship
 * directly from supplier partners — no fast-delivery promises.
 */
const ProductTabs = ({ product: _product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "Shipping & Returns",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full font-humanist">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">Shipping with tracking</span>
            <p className="max-w-sm">
              Orders are prepared by our supplier partners and shipped
              directly to you. Most orders arrive within 7-15 days, and
              every order includes tracking.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <span className="font-semibold">Wrong or damaged piece</span>
            <p className="max-w-sm">
              If your piece arrives damaged or is not what you ordered,
              contact us and we will send a replacement.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <span className="font-semibold">Returns</span>
            <p className="max-w-sm">
              If the piece is not right for you, contact us and we will make
              it right — replacement or refund.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
