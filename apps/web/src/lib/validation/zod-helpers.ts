import {
  FACEBOOK_URL_REGEX,
  INSTAGRAM_URL_REGEX,
  LINK_MAX_LENGTH,
  normalizePhone,
  PHONE_MAX_LENGTH,
  PHONE_REGEX,
  WEBSITE_URL_REGEX,
  YOUTUBE_URL_REGEX,
} from "@repo/common-lib/constants/validation";
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
export const emailField = (t: Translator) =>
  z.email(t("validation.email.invalid"));

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

/**
 * Optional free-text field constrained to `regex`. An empty string is allowed and
 * means "clear this field" (the API converts it to `null`); any other value must match.
 * Shared by all social/website link fields so the rule lives in one place.
 */
const optionalPatternField = (
  regex: RegExp,
  invalidMessage: string,
  maxMessage: string,
  maxLength: number = LINK_MAX_LENGTH,
) =>
  z
    .string()
    .max(maxLength, maxMessage)
    .refine((value) => value === "" || regex.test(value), invalidMessage)
    .optional();

/** Phone number: optional, normalized (spaces/dashes stripped), 9–15 digits with optional `+`. */
export const phoneField = (t: Translator) =>
  z.preprocess(
    (value) =>
      typeof value === "string" ? normalizePhone(value.trim()) : value,
    z
      .string()
      .max(PHONE_MAX_LENGTH, tooLongMessage(t, t("fields.phoneNumber")))
      .refine(
        (value) => value === "" || PHONE_REGEX.test(value),
        t("validation.phone.invalid"),
      )
      .optional(),
  );

/** Instagram profile URL (empty allowed). */
export const instagramUrlField = (t: Translator) =>
  optionalPatternField(
    INSTAGRAM_URL_REGEX,
    t("validation.url.instagram"),
    tooLongMessage(t, t("fields.instagramLink")),
  );

/** Facebook profile/page URL (empty allowed). */
export const facebookUrlField = (t: Translator) =>
  optionalPatternField(
    FACEBOOK_URL_REGEX,
    t("validation.url.facebook"),
    tooLongMessage(t, t("fields.facebookLink")),
  );

/** YouTube channel/handle URL (empty allowed). */
export const youtubeUrlField = (t: Translator) =>
  optionalPatternField(
    YOUTUBE_URL_REGEX,
    t("validation.url.youtube"),
    tooLongMessage(t, t("fields.youtubeLink")),
  );

/** Generic website URL (empty allowed). */
export const websiteUrlField = (t: Translator) =>
  optionalPatternField(
    WEBSITE_URL_REGEX,
    t("validation.url.website"),
    tooLongMessage(t, t("fields.websiteLink")),
  );

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
