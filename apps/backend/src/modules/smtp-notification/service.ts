/**
 * SMTP email notification provider via Nodemailer.
 *
 * Sends transactional emails (order confirmation, shipping updates, etc.)
 * via SMTP. Templates are rendered by the caller — this provider
 * takes the final subject/html/text.
 *
 * Env:
 *   SMTP_HOST - SMTP server hostname (e.g. smtp.hostinger.com)
 *   SMTP_PORT - SMTP port (e.g. 465 for SSL, 587 for STARTTLS)
 *   SMTP_SECURE - 'true' for SSL (port 465), 'false' for STARTTLS (port 587)
 *   SMTP_USER - SMTP auth username
 *   SMTP_PASS - SMTP auth password
 *   SMTP_FROM - default sender, e.g. "3rd Eye Supply <support@702aiservices.com>"
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
import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"

type InjectedDependencies = {
  logger: Logger
}

interface SmtpOptions {
  host?: string
  port?: number
  secure?: boolean
  user?: string
  pass?: string
  from?: string
}

class SmtpNotificationService extends AbstractNotificationProviderService {
  static identifier = "smtp"

  protected logger_: Logger
  protected transporter_: Transporter
  protected from_: string

  constructor({ logger }: InjectedDependencies, options: SmtpOptions = {}) {
    super()
    this.logger_ = logger

    const host = options.host || process.env.SMTP_HOST || ""
    const port = options.port || parseInt(process.env.SMTP_PORT || "587", 10)
    const secure =
      options.secure ?? (process.env.SMTP_SECURE === "true" || port === 465)
    const user = options.user || process.env.SMTP_USER || ""
    const pass = options.pass || process.env.SMTP_PASS || ""
    this.from_ =
      options.from ||
      process.env.SMTP_FROM ||
      "3rd Eye Supply <support@702aiservices.com>"

    if (!host || !user || !pass) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "SMTP notification: SMTP_HOST, SMTP_USER, and SMTP_PASS must be configured."
      )
    }

    this.transporter_ = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    })
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
        "SMTP notification: data.html or data.text is required."
      )
    }

    const info = await this.transporter_.sendMail({
      from: notification.from || this.from_,
      to: notification.to,
      subject,
      html,
      text,
    })

    this.logger_.info(
      "SMTP: email sent to " + notification.to + " (" + info.messageId + ")"
    )
    return { id: info.messageId }
  }
}

export default SmtpNotificationService
