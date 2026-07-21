import * as z from "zod";
import type { Translator } from "@/lib/validation/zod-helpers";

export const createAboutPageSchema = (t: Translator) =>
  z.object({
    title: z
      .string({ message: t("validation.aboutPage.titleType") })
      .min(5, { message: t("validation.aboutPage.titleMin") })
      .max(255, { message: t("validation.aboutPage.titleMax") })
      .optional(),
    description: z
      .string({ message: t("validation.aboutPage.descriptionRequired") })
      .min(20, { message: t("validation.aboutPage.descriptionMin") })
      .max(1000, { message: t("validation.aboutPage.descriptionMax") }),
    user_id: z
      .number({ message: t("validation.aboutPage.userIdRequired") })
      .positive({ message: t("validation.aboutPage.userIdPositive") }),
  });

export const updateAboutPageSchema = (t: Translator) =>
  z.object({
    title: z
      .string({ message: t("validation.aboutPage.titleType") })
      .min(5, { message: t("validation.aboutPage.titleMin") })
      .max(255, { message: t("validation.aboutPage.titleMax") })
      .optional(),
    description: z
      .string({ message: t("validation.aboutPage.descriptionType") })
      .min(20, { message: t("validation.aboutPage.descriptionMin") })
      .max(1000, { message: t("validation.aboutPage.descriptionMax") })
      .optional(),
  });
