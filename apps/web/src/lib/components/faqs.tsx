import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/shadcn/accordion";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

export type FaqItem = { id: string; question: string; answer: string };

/** Deep-link id for the wait-list FAQ (must match `faqs.items[].id` in i18n). */
export const WAIT_LIST_FAQ_ID = "wait-list-how-it-works" as const;

/**
 * Shared styles for the rich HTML rendered inside a FAQ answer.
 * Answers come from the translation files and may include custom markup
 * (links, emphasis) — anchors are styled here so authors only need to add
 * the `<a>` tag in the message.
 */
export const faqAnswerClassName =
  "w-full text-base! leading-[1.5] text-text-muted [&_a]:font-medium [&_a]:text-text [&_a]:underline [&_a]:underline-offset-4 [&_a]:transition-colors [&_a:hover]:text-text-muted [&_strong]:font-semibold [&_strong]:text-text [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_li]:leading-[1.5]";

/**
 * Prefix the site-relative `<a href="/…">` links embedded in a translated FAQ answer with the
 * active locale.
 *
 * The answers are raw HTML in the message files, so they bypass the i18n `Link` entirely: without
 * this, the Spanish and Portuguese answers link to the *English* /about, /support and
 * /auth/register — cross-language internal links that muddy the hreflang cluster and drop the
 * reader out of their language. `localePrefix` is "as-needed", so `en` is left untouched.
 * In-page anchors (`href="#…"`) and absolute URLs are not site-relative and are left alone.
 */
export function localizeFaqAnswer(answer: string, locale: string): string {
  if (locale === "en") return answer;
  return answer.replace(
    /href=(["'])\/(?!\/)/g,
    (_match, quote) => `href=${quote}/${locale}/`,
  );
}

export function FaqsContent() {
  const t = useTranslations("faqs");
  const locale = useLocale();
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
                <div
                  dangerouslySetInnerHTML={{
                    __html: localizeFaqAnswer(faq.answer, locale),
                  }}
                />
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
