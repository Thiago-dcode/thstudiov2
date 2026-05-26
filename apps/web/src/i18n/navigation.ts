import { createNavigation } from 'next-intl/navigation';
import { routing, SUPPORTED_LOCALES, localeLabels } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export { SUPPORTED_LOCALES, localeLabels };
