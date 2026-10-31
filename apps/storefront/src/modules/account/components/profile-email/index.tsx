"use client"

import React from "react"
import { HttpTypes } from "@medusajs/types"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

/**
 * Email is the login identity, so editing it here would leave the account
 * unable to sign in. Rather than showing a form whose Save button cannot work,
 * this is read-only and hands the customer a human who can move the identity.
 */
const ProfileEmail: React.FC<MyInformationProps> = ({ customer }) => {
  return (
    <div
      className="text-small-regular"
      data-testid="account-email-editor"
    >
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <span className="uppercase text-ui-fg-base">Email</span>
          <span className="font-semibold" data-testid="current-info">
            {customer.email}
          </span>
        </div>
      </div>
      <p className="mt-2 text-ui-fg-subtle">
        Your sign-in email is tied to your login, so it can&apos;t be changed
        here. Email{" "}
        <a className="underline" href="mailto:support@3rdeyesupply.com">
          support@3rdeyesupply.com
        </a>{" "}
        from your current address and we&apos;ll move it for you.
      </p>
    </div>
  )
}

export default ProfileEmail
