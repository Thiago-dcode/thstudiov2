import * as z from "zod";

/**
 * Matches the shape of both `useTranslations()` and the awaited `getTranslations()`.
 * `key` is typed `any` rather than `string`: next-intl narrows its own `t`'s key
 * parameter to a namespaced-keys union, which is incompatible with a plain
 * `string` parameter under `strictFunctionTypes` (contravariance) — `any` sidesteps
 * that mismatch so any of next-intl's `t` variants can be passed in directly.
 */
export type Translator = (
  key: any,
  values?: Record<string, string | number>,
) => string;

/** `{field} is required` — the most common validation message across schemas. */
export const requiredString = (t: Translator, fieldLabel: string) =>
  z.string().min(1, t("validation.required", { field: fieldLabel }));

const SLUG_REGEX = /^[a-z0-9-]+$/;

/** Shared slug rule used by portfolios, services, and collections. */
export const slugField = (t: Translator) =>
  z
    .string()
    .min(3, t("validation.slug.tooShort"))
    .regex(SLUG_REGEX, t("validation.slug.invalidFormat"));

/** Shared email rule used across contact, user, and preference schemas. */
export const emailField = (t: Translator) => z.email(t("validation.email.invalid"));

/** `{field} must be at least {min} characters` */
export const minLengthMessage = (
  t: Translator,
  fieldLabel: string,
  min: number,
) => t("validation.minLength", { field: fieldLabel, min });

/** `{field} must be at most {max} characters` */
export const maxLengthMessage = (
  t: Translator,
  fieldLabel: string,
  max: number,
) => t("validation.maxLength", { field: fieldLabel, max });

/** `{field} is too long` */
export const tooLongMessage = (t: Translator, fieldLabel: string) =>
  t("validation.tooLong", { field: fieldLabel });

/** A person's given/family name field: required, capped length, no digits. */
export const personNameField = (
  t: Translator,
  maxLength: number,
  fieldLabel: string,
) =>
  z
    .string()
    .min(1, t("validation.required", { field: fieldLabel }))
    .max(maxLength, tooLongMessage(t, fieldLabel))
    .regex(/^[^\d]*$/, t("validation.invalid", { field: fieldLabel }));
