"use client"

import React, { useActionState, useEffect } from "react"
import Input from "@modules/common/components/input"
import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"
import { EMAIL_CHANGE_SUPPORT_MESSAGE } from "@lib/data/customer"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

/**
 * Email is the login identity, so changing it here would leave the account
 * unable to sign in. Rather than a form that always "succeeds" and changes
 * nothing, this explains the situation and hands the customer a human.
 */
const ProfileEmail: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)

  const submit = async () => {
    return { success: false, error: EMAIL_CHANGE_SUPPORT_MESSAGE }
  }

  const [state, formAction] = useActionState(submit, {
    error: null as string | null,
    success: false,
  })

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
  }, [state])

  return (
    <form action={formAction} className="w-full">
      <AccountInfo
        label="Email"
        currentInfo={`${customer.email}`}
        isSuccess={successState}
        isError={!!state.error}
        errorMessage={state.error || undefined}
        clearState={clearState}
        data-testid="account-email-editor"
      >
        <div className="grid grid-cols-1 gap-y-2">
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            disabled
            defaultValue={customer.email}
            data-testid="email-input"
          />
          <p className="text-small-regular text-ui-fg-subtle">
            Contact{" "}
            <a className="underline" href="mailto:support@3rdeyesupply.com">
              support@3rdeyesupply.com
            </a>{" "}
            to change your sign-in email.
          </p>
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileEmail
