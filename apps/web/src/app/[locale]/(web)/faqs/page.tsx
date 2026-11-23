import {
  EDITORIAL_PROSE_LINK_CLASS,
  EditorialHeader,
  EditorialLabel,
  editorialHeadlineClass,
} from "@repo/ui/components/custom/editorial";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  type FaqItem,
  faqAnswerClassName,
  localizeFaqAnswer,
} from "@/lib/components/faqs";
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
    titleAbsolute: true,
    description: t("page.metadata.description"),
    locale,
  });
}

export default async function FaqsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("faqs");
  const items = t.raw("items") as FaqItem[];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-20 tablet:px-10 tablet:py-28">
      <JsonLd data={buildFaqPageJsonLd(items, locale)} />

      <EditorialHeader
        as="h1"
        label={t("page.hero.label")}
        title={t("page.hero.title")}
        standfirst={t("page.hero.lead")}
      />

      {/* Same 12-column rhythm as the opening: the index sits under the label, answers under
          the headline. */}
      <div className="mt-16 grid grid-cols-1 gap-10 laptop:mt-24 laptop:grid-cols-12 laptop:gap-x-10">
        {/* Aside nav — jump to any question by its id. */}
        <aside className="hidden laptop:col-span-3 laptop:block">
          <nav
            aria-label={t("page.navLabel")}
            className="sticky top-24 space-y-3"
          >
            <EditorialLabel className="mb-5">
              {t("page.navLabel")}
            </EditorialLabel>
            <ul className="space-y-1 border-l border-border">
              {items.map((faq) => (
                <li key={faq.id}>
                  <a
                    href={`#${faq.id}`}
                    className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm leading-snug text-text-muted transition-colors hover:border-text hover:text-text"
                  >
                    {faq.question}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="min-w-0 max-w-[38rem] laptop:col-span-9">
          {items.map((faq) => (
            <FaqSection key={faq.id} faq={faq} locale={locale} />
          ))}

          <div className="mt-10 border-t border-border pt-8 text-base tablet:text-lg">
            <span>
              {t.rich("stillHaveQuestions", {
                link: (children) => (
                  <Link href="/support" className={EDITORIAL_PROSE_LINK_CLASS}>
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

/** One question rendered as a titled section (no accordion) so all answers are visible + crawlable. */
function FaqSection({ faq, locale }: { faq: FaqItem; locale: string }) {
  const headingId = `${faq.id}-heading`;
  return (
    <section
      id={faq.id}
      aria-labelledby={headingId}
      className="scroll-mt-28 border-b border-border py-10 first:pt-0"
    >
      <h2 id={headingId} className={`mb-5 ${editorialHeadlineClass("sub")}`}>
        {faq.question}
      </h2>
      <div
        className={faqAnswerClassName}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: answers are trusted, authored in our own translation files
        dangerouslySetInnerHTML={{
          __html: localizeFaqAnswer(faq.answer, locale),
        }}
      />
    </section>
  );
}
