import { AbstractNotificationProviderService } from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"
import twilio from "twilio"

type Options = {
  accountSid: string
  authToken: string
  fromNumber: string
}

export default class TwilioNotificationService extends AbstractNotificationProviderService {
  static identifier = "twilio-sms"
  protected logger_: Logger
  protected options_: Options
  protected client_: any

  constructor(container: any, options: Options) {
    super()
    this.logger_ = container.logger
    this.options_ = options
    this.client_ = twilio(options.accountSid, options.authToken)
  }

  async send(notification: any): Promise<any> {
    const { to, content } = notification
    if (!to) {
      this.logger_.warn("Twilio: no recipient phone number")
      return { status: "skipped" }
    }
    const body = typeof content === "string" ? content : content?.body || JSON.stringify(content)
    try {
      const msg = await this.client_.messages.create({
        to,
        from: this.options_.fromNumber,
        body,
      })
      this.logger_.info(`Twilio SMS sent: ${msg.sid}`)
      return { status: "sent", sid: msg.sid }
    } catch (err: any) {
      this.logger_.error(`Twilio SMS failed: ${err.message}`)
      throw err
    }
  }
}
