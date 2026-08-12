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

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
        {/* Aside nav — jump to any question by its id. */}
        <aside className="hidden lg:block">
          <nav
            aria-label={t("page.navLabel")}
            className="sticky top-24 space-y-3"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
              {t("page.navLabel")}
            </p>
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

        <div className="min-w-0">
          {items.map((faq) => (
            <FaqSection key={faq.id} faq={faq} locale={locale} />
          ))}

          <div className="mt-10 border-t border-border pt-8 text-base tablet:text-lg">
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

/** One question rendered as a titled section (no accordion) so all answers are visible + crawlable. */
function FaqSection({ faq, locale }: { faq: FaqItem; locale: string }) {
  const headingId = `${faq.id}-heading`;
  return (
    <section
      id={faq.id}
      aria-labelledby={headingId}
      className="scroll-mt-28 border-b border-border py-8 first:pt-0"
    >
      <h2
        id={headingId}
        className="mb-4 font-serif text-xl font-semibold tracking-tight text-text tablet:text-2xl"
      >
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
