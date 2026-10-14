"use server";

import { ENUMS, type EnumType } from "@repo/common-lib/constants/enums";
import type { ContentReport } from "@repo/common-lib/types/content-report";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { getTranslations } from "next-intl/server";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import contentReportsService from "../content-reports.service";

type Inputs = {
  reported_url: string;
  reason: string;
  reporter_name: string;
  reporter_email: string;
};

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

/**
 * Files a DSA notice. The API validates everything again; the checks here only turn the common
 * mistakes into field errors instead of a generic failure.
 */
export const createContentReportAction = async (
  formData: FormData,
): Promise<ActionReturn<Pick<ContentReport, "id" | "created_at">, Inputs>> => {
  const t = await getTranslations("report.form");
  const inputs: Inputs = {
    reported_url: text(formData, "reported_url"),
    reason: text(formData, "reason"),
    reporter_name: text(formData, "reporter_name"),
    reporter_email: text(formData, "reporter_email"),
  };
  const explanation = text(formData, "explanation");

  const inputErrors: Record<string, string> = {};
  if (!/^https?:\/\//i.test(inputs.reported_url)) {
    inputErrors.reported_url = t("errors.url");
  }
  if (
    !(ENUMS.CONTENT_REPORT_REASON as readonly string[]).includes(inputs.reason)
  ) {
    inputErrors.reason = t("errors.reason");
  }
  if (explanation.length < 20)
    inputErrors.explanation = t("errors.explanation");
  if (formData.get("good_faith") !== "on")
    inputErrors.good_faith = t("errors.goodFaith");
  if (Object.keys(inputErrors).length) {
    return { data: null, errors: [], inputErrors, inputs };
  }

  const result = await contentReportsService.create({
    reported_url: inputs.reported_url,
    reason: inputs.reason as EnumType<"CONTENT_REPORT_REASON">,
    explanation,
    reporter_name: inputs.reporter_name || null,
    reporter_email: inputs.reporter_email || null,
    good_faith: true,
  });
  if (result.error) {
    const errors =
      result.error.status_code === 400
        ? [t("errors.notOurSite")]
        : result.error.status_code === 429
          ? [t("errors.tooMany")]
          : await getFriendlyApiErrors(result);
    return { data: null, errors, inputs };
  }

  return { data: result.data!, errors: null, inputErrors: undefined, inputs };
};
