/**
 * SMTP notification provider module.
 * Register under the Notification module's providers in medusa-config.ts.
 * See service.ts for env vars.
 */
import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import SmtpNotificationService from "./service"

export const SMTP_NOTIFICATION_MODULE = "smtp_notification"

// Notification providers use ModuleProvider (not Module) — the notification
// module wires up the services array as providers.
export default ModuleProvider(Modules.NOTIFICATION, {
  services: [SmtpNotificationService],
})
