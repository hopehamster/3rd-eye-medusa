/**
 * Resend email notification provider.
 *
 * Sends transactional emails (order confirmation, shipping updates, etc.)
 * via the Resend API. Templates are rendered by the caller — this provider
 * takes the final subject/html/text.
 *
 * Env:
 *   RESEND_API_KEY - Resend API key
 *   RESEND_FROM_EMAIL - default sender, e.g. "3rd Eye Supply <orders@3rdeyesupply.com>"
 *
 * Register under the Notification module's providers in medusa-config.ts.
 */
import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import type {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"

type InjectedDependencies = {
  logger: Logger
}

interface ResendOptions {
  apiKey?: string
  from?: string
}

class ResendNotificationService extends AbstractNotificationProviderService {
  static identifier = "resend"

  protected logger_: Logger
  protected apiKey_: string
  protected from_: string

  constructor({ logger }: InjectedDependencies, options: ResendOptions = {}) {
    super()
    this.logger_ = logger
    this.apiKey_ = options.apiKey || process.env.RESEND_API_KEY || ""
    this.from_ = options.from || process.env.RESEND_FROM_EMAIL || ""
    if (!this.apiKey_) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Resend notification: RESEND_API_KEY must be configured."
      )
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const data = (notification.data ?? {}) as Record<string, unknown>
    const subject =
      typeof data.subject === "string" ? data.subject : "3rd Eye Supply"
    const html = typeof data.html === "string" ? data.html : undefined
    const text = typeof data.text === "string" ? data.text : undefined

    if (!html && !text) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Resend notification: data.html or data.text is required."
      )
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey_}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: notification.from || this.from_,
        to: notification.to,
        subject,
        html,
        text,
      }),
    })

    const body = (await res.json().catch(() => ({}))) as {
      id?: string
      message?: string
    }
    if (!res.ok) {
      throw new MedusaError(
        MedusaError.Types.DB_ERROR,
        `Resend API error: ${res.status} ${body.message ?? ""}`.trim()
      )
    }

    this.logger_.info(`Resend: email sent to ${notification.to} (${body.id})`)
    return { id: body.id }
  }
}

export default ResendNotificationService
