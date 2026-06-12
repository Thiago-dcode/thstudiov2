import type { routing } from "./src/i18n/routing";
import type { Messages as AppMessages } from "./src/i18n/messages/en";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: AppMessages;
  }
}
