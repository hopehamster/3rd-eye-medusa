import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import TwilioNotificationService from "./service"

export const TWILIO_NOTIFICATION_MODULE = "twilio_notification"

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [TwilioNotificationService],
})
