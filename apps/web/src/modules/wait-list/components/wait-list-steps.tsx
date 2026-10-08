"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { WAIT_LIST_FAQ_ID } from "@/lib/components/faqs";

type WaitListStep = { title: string; description: string };

export function WaitListSteps() {
  const t = useTranslations("landing.hero");
  const steps = t.raw("waitList.dialog.steps") as WaitListStep[];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-text">
        {t("waitList.dialog.stepsTitle")}
      </p>
      <ol className="flex flex-col gap-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-fg"
            >
              {index + 1}
            </span>
            <p className="min-w-0 text-left text-sm leading-snug text-text-muted">
              <strong className="font-semibold text-text">{step.title}</strong>{" "}
              {step.description}
            </p>
          </li>
        ))}
      </ol>
      <Link
        href={`/faqs#${WAIT_LIST_FAQ_ID}`}
        className="w-fit text-sm font-medium text-text underline underline-offset-4 transition-colors hover:text-text-muted"
      >
        {t("waitList.dialog.learnMore")}
      </Link>
    </div>
  );
}
