import { createNavigation } from "next-intl/navigation";
import { localeLabels, routing, SUPPORTED_LOCALES } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export { localeLabels, SUPPORTED_LOCALES };
