import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { type FaqItem, faqAnswerClassName } from "@/lib/components/faqs";
import { buildFaqPageJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("faqs");
  return buildStaticPageMetadata({
    path: "/faqs",
    title: t("page.metadata.title"),
    description: t("page.metadata.description"),
    locale,
  });
}

export default async function FaqsPage() {
  const t = await getTranslations("faqs");
  const items = t.raw("items") as FaqItem[];

  return (
    <div className="mx-auto w-full max-w-(--screen-desktop) px-6 py-16 tablet:px-10 tablet:py-24">
      <JsonLd data={buildFaqPageJsonLd(items)} />
      <header className="max-w-2xl space-y-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
          {t("page.hero.label")}
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-text tablet:text-4xl">
          {t("page.hero.title")}
        </h1>
        <p className="text-sm leading-relaxed text-text-muted">
          {t("page.hero.lead")}
        </p>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-10  desktop:gap-16 w-full">
        <div className="w-full">
          <div className="border-t border-border w-full">
            {items.map((faq) => (
              <FaqEntry key={faq.id} faq={faq} />
            ))}
          </div>

          <div className="mt-8 text-base tablet:text-lg">
            <span>
              {t.rich("stillHaveQuestions", {
                link: (children) => (
                  <Link
                    href="/support"
                    className="underline underline-offset-4"
                  >
                    {children}
                  </Link>
                ),
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqEntry({ faq }: { faq: FaqItem }) {
  return (
    <details
      id={faq.id}
      className="group scroll-mt-28 border-b border-border w-full"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-medium text-text marker:content-none [&::-webkit-details-marker]:hidden">
        {faq.question}
        <ChevronDown className="size-4 shrink-0 text-text-muted transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className={`pb-4 ${faqAnswerClassName}`}>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: answers are trusted, authored in our own translation files */}
        <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
      </div>
    </details>
  );
}
