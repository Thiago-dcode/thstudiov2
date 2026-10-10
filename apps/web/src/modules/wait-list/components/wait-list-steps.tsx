"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/shadcn/accordion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { WAIT_LIST_FAQ_ID } from "@/lib/components/faqs";

type WaitListStep = { title: string; description: string };

const STEPS_ACCORDION_ID = "wait-list-steps";

function StepsList({ steps }: { steps: WaitListStep[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, index) => (
        <li key={step.title} className="flex items-baseline gap-3">
          <span
            aria-hidden="true"
            className="w-4 shrink-0 text-sm font-semibold tabular-nums text-text"
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
  );
}

export function WaitListSteps() {
  const t = useTranslations("landing.hero");
  const steps = t.raw("waitList.dialog.steps") as WaitListStep[];
  const title = t("waitList.dialog.stepsTitle");

  const learnMore = (
    <Link
      href={`/faqs#${WAIT_LIST_FAQ_ID}`}
      className="w-fit text-sm font-medium text-text underline underline-offset-4 transition-colors hover:text-text-muted"
    >
      {t("waitList.dialog.learnMore")}
    </Link>
  );

  return (
    <>
      <Accordion
        type="single"
        collapsible
        defaultValue={STEPS_ACCORDION_ID}
        className="phone-lg:hidden"
      >
        <AccordionItem
          value={STEPS_ACCORDION_ID}
          className="border-y border-border"
        >
          <AccordionTrigger className="min-h-11 py-3 text-sm font-medium text-text hover:no-underline">
            {title}
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 pb-4">
            <StepsList steps={steps} />
            {learnMore}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="hidden flex-col gap-3 phone-lg:flex">
        <p className="text-sm font-medium text-text">{title}</p>
        <StepsList steps={steps} />
        {learnMore}
      </div>
    </>
  );
}
