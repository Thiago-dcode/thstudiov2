import { defineRouting } from 'next-intl/routing';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/constants';
import type { EnumType } from '@repo/common-lib/constants/enums';

// Subset of LANGUAGE_CODE that has a messages file. Add more by appending here + adding the file.
const SUPPORTED_LOCALES = ['EN', 'ES'] as const satisfies readonly EnumType<'LANGUAGE_CODE'>[];

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LANGUAGE,
  localePrefix: 'as-needed',
  localeDetection: true,
});
