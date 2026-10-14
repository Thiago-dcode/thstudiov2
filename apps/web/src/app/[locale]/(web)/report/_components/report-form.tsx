"use client";

import { ENUMS } from "@repo/common-lib/constants/enums";
import { Errors } from "@repo/ui/components/custom/errors";
import { Label } from "@repo/ui/components/shadcn/label";
import { Select } from "@repo/ui/components/shadcn/select";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import FormComponent from "@/lib/components/form-component";
import { FormPrivacyNotice } from "@/lib/components/form-privacy-notice";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { createContentReportAction } from "@/modules/content-reports/server-actions/create-content-report.action";

/**
 * DSA art. 16 notice form. Collects exactly what art. 16(2) lists: where the content is, why it is
 * illegal, optionally who is reporting, and the good-faith statement.
 */
export function ReportForm({ initialUrl }: { initialUrl?: string }) {
  const t = useTranslations("report.form");
  const [reference, setReference] = useState<number | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  // Arrived via the footer link from a page on this site: report that page by default.
  useEffect(() => {
    if (initialUrl || !urlRef.current || urlRef.current.value) return;
    try {
      const referrer = new URL(document.referrer);
      if (referrer.origin === window.location.origin) {
        urlRef.current.value = referrer.href;
      }
    } catch {
      // No (or a cross-site) referrer: the visitor pastes the URL.
    }
  }, [initialUrl]);

  const { handleSubmit, isPending, inputErrors, errors, cleanErrors } =
    useHandleAction({
      action: createContentReportAction,
      afterAction: async (result) => {
        if (result.data) setReference(result.data.id);
      },
    });

  if (reference !== null) {
    return (
      <div role="status" className="space-y-2">
        <p className="text-base! font-medium text-text">{t("success.title")}</p>
        <p className="text-sm! text-text-muted">
          {t("success.body", { id: reference })}
        </p>
      </div>
    );
  }

  return (
    <FormComponent.Container>
      <FormComponent.Form onSubmit={handleSubmit} className="gap-4">
        <FormComponent.LabelInput
          ref={urlRef}
          label={t("urlLabel")}
          name="reported_url"
          id="report-url"
          type="url"
          placeholder="https://a11studio.com/artists/…"
          required
          defaultValue={initialUrl}
          error={inputErrors?.reported_url}
          onChange={() => cleanErrors()}
        />

        <div className="w-full space-y-1">
          <Label
            htmlFor="report-reason"
            className="block text-xs tracking-wide text-text-muted"
          >
            {t("reasonLabel")} <span className="text-red-500">*</span>
          </Label>
          <Select
            id="report-reason"
            name="reason"
            required
            defaultValue=""
            aria-invalid={!!inputErrors?.reason}
            className="h-12"
          >
            <option value="" disabled>
              {t("reasonPlaceholder")}
            </option>
            {ENUMS.CONTENT_REPORT_REASON.map((reason) => (
              <option key={reason} value={reason}>
                {t(`reasons.${reason}`)}
              </option>
            ))}
          </Select>
          {inputErrors?.reason ? (
            <p className="mt-1 text-xs! text-red-500">{inputErrors.reason}</p>
          ) : null}
        </div>

        <FormComponent.LabelTextarea
          label={t("explanationLabel")}
          name="explanation"
          id="report-explanation"
          placeholder={t("explanationPlaceholder")}
          required
          minLength={20}
          maxLength={5000}
          rows={6}
          error={inputErrors?.explanation}
        />

        <FormComponent.LabelInput
          label={t("nameLabel")}
          name="reporter_name"
          id="report-name"
          autoComplete="name"
          maxLength={255}
        />

        <FormComponent.LabelInput
          label={t("emailLabel")}
          name="reporter_email"
          id="report-email"
          type="email"
          autoComplete="email"
          maxLength={255}
          extraInfo={t("emailInfo")}
        />

        <FormComponent.Field>
          <label
            htmlFor="report-good-faith"
            className="flex cursor-pointer items-start gap-2.5"
          >
            <input
              type="checkbox"
              id="report-good-faith"
              name="good_faith"
              required
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-text"
            />
            <span className="text-xs leading-relaxed text-text-muted">
              {t("goodFaith")}
            </span>
          </label>
          {inputErrors?.good_faith ? (
            <p className="mt-1 text-xs! text-red-500">
              {inputErrors.good_faith}
            </p>
          ) : null}
        </FormComponent.Field>

        <FormPrivacyNotice context="report" />

        {errors && errors.length > 0 && <Errors errors={errors} />}

        <FormComponent.SubmitButton isPending={isPending} className="h-12">
          {t("submit")}
        </FormComponent.SubmitButton>
      </FormComponent.Form>
    </FormComponent.Container>
  );
}
