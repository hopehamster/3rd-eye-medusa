"use client"

import React from "react"
import Input from "@modules/common/components/input"
import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"
import { updateCustomerPassword } from "@lib/data/customer"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfilePassword: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  const clearState = () => {
    setSuccessState(false)
    setError(null)
  }

  const updatePassword = async (formData: FormData) => {
    setPending(true)
    clearState()

    const oldPassword = String(formData.get("old_password") ?? "")
    const newPassword = String(formData.get("new_password") ?? "")
    const confirmPassword = String(formData.get("confirm_password") ?? "")

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.")
      setPending(false)
      return
    }
    const result = await updateCustomerPassword(oldPassword, newPassword)

    if (result.success) {
      setSuccessState(true)
    } else {
      setError(result.error ?? "Could not update the password.")
    }
    setPending(false)
  }

  return (
    <form action={updatePassword} onReset={clearState} className="w-full">
      <AccountInfo
        label="Password"
        currentInfo={
          <span>The password is not shown for security reasons</span>
        }
        isSuccess={successState}
        isError={!!error}
        errorMessage={error ?? undefined}
        clearState={clearState}
        data-testid="account-password-editor"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Old password"
            name="old_password"
            required
            type="password"
            autoComplete="current-password"
            data-testid="old-password-input"
          />
          <Input
            label="New password"
            type="password"
            name="new_password"
            required
            autoComplete="new-password"
            data-testid="new-password-input"
          />
          <Input
            label="Confirm password"
            type="password"
            name="confirm_password"
            required
            autoComplete="new-password"
            data-testid="confirm-password-input"
          />
        </div>
        {pending && (
          <p className="mt-2 text-small-regular text-ui-fg-muted">
            Updating…
          </p>
        )}
      </AccountInfo>
    </form>
  )
}

export default ProfilePassword
