import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/shadcn/accordion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export type FaqItem = { id: string; question: string; answer: string };

/**
 * Shared styles for the rich HTML rendered inside a FAQ answer.
 * Answers come from the translation files and may include custom markup
 * (links, emphasis) — anchors are styled here so authors only need to add
 * the `<a>` tag in the message.
 */
export const faqAnswerClassName =
  "w-full text-base! leading-[1.4] text-text-muted [&_a]:font-medium [&_a]:text-text [&_a]:underline [&_a]:underline-offset-4 [&_a]:transition-colors [&_a:hover]:text-text-muted";

export function FaqsContent() {
  const t = useTranslations("faqs");
  const items = t.raw("items") as FaqItem[];

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-serif text-2xl! font-light  leading-none tracking-tight tablet:text-3xl desktop:text-5xl">
        {t("title")}
      </h2>

      <div className="flex flex-col">
        <Accordion
          defaultValue={items[0]?.id}
          type="single"
          collapsible
          className="w-full"
        >
          {items.map((faq) => (
            <AccordionItem key={faq.id} id={faq.id} value={faq.id}>
              <AccordionTrigger className="text-base! font-medium tablet:text-xl py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className={faqAnswerClassName}>
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: answers are trusted, authored in our own translation files */}
                <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="flex flex-col gap-4 border-t border-border pt-6 text-base tablet:flex-row tablet:items-center tablet:justify-between tablet:pt-8 tablet:text-lg">
          <span>
            {t.rich("stillHaveQuestions", {
              link: (children) => (
                <Link href="/support" className="underline underline-offset-4">
                  {children}
                </Link>
              ),
            })}
          </span>
          <Link
            href="/faqs"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
          >
            {t("viewAll")}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function FaqsSection() {
  return (
    <section className="relative mx-auto w-full max-w-(--screen-desktop) px-6 py-20 tablet:px-10 tablet:py-28">
      <FaqsContent />
    </section>
  );
}
