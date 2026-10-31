import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import twilio from "twilio"

export default async function passwordlessSmsHandler({
  event: { data },
  container,
}: SubscriberArgs<{ phone: string; otp: string; attempt: number; expiryTime: string }>) {
  const logger = container.resolve("logger")
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    logger.warn("Twilio not configured, skipping SMS")
    return
  }

  const { phone, otp } = data
  const client = twilio(accountSid, authToken)

  try {
    const msg = await client.messages.create({
      to: phone,
      from: fromNumber,
      body: `Your 3rd Eye Supply verification code is: ${otp}`,
    })
    logger.info(`Passwordless SMS sent to ${phone}: ${msg.sid}`)
  } catch (err: any) {
    logger.error(`Failed to send passwordless SMS: ${err.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "passwordless.otp.generated",
}
