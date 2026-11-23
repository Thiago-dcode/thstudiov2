import {
  EDITORIAL_PROSE_CLASS,
  EDITORIAL_STANDFIRST_CLASS,
  EDITORIAL_STATEMENT_CLASS,
  EditorialChapter,
  EditorialHeader,
  EditorialRule,
  editorialHeadlineClass,
  editorialNumber,
} from "@repo/ui/components/custom/editorial";
import { Button } from "@repo/ui/components/shadcn/button";
import { cn } from "@repo/ui/lib/utils";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { buildAboutPageJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("about.metadata");
  return buildStaticPageMetadata({
    path: "/about",
    title: t("title"),
    titleAbsolute: true,
    description: t("description"),
    locale,
    ogType: "article",
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("about");
  const tMeta = await getTranslations("about.metadata");
  const tSeo = await getTranslations("seo");

  const valueItems = t.raw("values.items") as {
    title: string;
    description: string;
  }[];
  const whyItems = t.raw("why.items") as {
    title: string;
    description: string;
  }[];
  const whoItems = t.raw("who.items") as string[];
  const whatParagraphs = t.raw("what.paragraphs") as string[];
  const visionParagraphs = t.raw("vision.paragraphs") as string[];
  const creatorParagraphs = t.raw("creator.paragraphs") as string[];
  const visionItems = t.raw("vision.items") as string[];
  const socialItems = t.raw("problem.socialItems") as string[];
  const websiteItems = t.raw("problem.websiteItems") as string[];

  return (
    <article className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-5 py-20 tablet:gap-20 tablet:px-10 tablet:py-28">
      <JsonLd
        data={buildAboutPageJsonLd(locale, {
          description: tSeo("organizationDescription"),
          founderRole: tSeo("founderRole"),
          pageName: tMeta("title"),
        })}
      />
      <EditorialHeader
        as="h1"
        label={t("hero.label")}
        title={t("hero.title")}
        standfirst={t("hero.lead")}
      />

      <Section id="what" index={1} title={t("what.title")}>
        {whatParagraphs.map((paragraph) => (
          <P key={paragraph}>{paragraph}</P>
        ))}
      </Section>

      <Section id="problem" index={2} title={t("problem.title")}>
        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className={SUBHEAD_CLASS}>{t("problem.socialLabel")}</h3>
            <BulletList items={socialItems} />
          </div>
          <div className="space-y-3">
            <h3 className={SUBHEAD_CLASS}>{t("problem.websiteLabel")}</h3>
            <BulletList items={websiteItems} />
          </div>
          <P>{t("problem.closing")}</P>
        </div>
      </Section>

      <Section id="mission" index={3} title={t("mission.title")}>
        <p className={EDITORIAL_STATEMENT_CLASS}>{t("mission.statement")}</p>
        <P>{t("mission.body")}</P>
      </Section>

      <Section id="why" index={4} title={t("why.title")}>
        <TitledList items={whyItems} />
      </Section>

      <Section id="values" index={5} title={t("values.title")}>
        <TitledList items={valueItems} />
      </Section>

      <Section id="who" index={6} title={t("who.title")}>
        <P>{t("who.intro")}</P>
        <BulletList items={whoItems} />
        <P>{t("who.closing")}</P>
      </Section>

      <Section id="vision" index={7} title={t("vision.title")}>
        {visionParagraphs.map((paragraph) => (
          <P key={paragraph}>{paragraph}</P>
        ))}
        <BulletList items={visionItems} />
        {/* The brand doc: future features must be labelled as not available yet. */}
        <p className="max-w-[38rem] text-sm! leading-relaxed! text-text-muted">
          {t("vision.note")}
        </p>
      </Section>

      <Section id="philosophy" index={8} title={t("philosophy.title")}>
        <p className={EDITORIAL_STATEMENT_CLASS}>{t("philosophy.question")}</p>
        <P>{t("philosophy.answer")}</P>
      </Section>

      <Section id="creator" index={9} title={t("creator.title")}>
        {creatorParagraphs.map((paragraph) => (
          <P key={paragraph}>{paragraph}</P>
        ))}
      </Section>

      <section
        aria-labelledby="about-cta-heading"
        className="flex flex-col items-center gap-8 py-12 text-center tablet:py-20"
      >
        <EditorialRule />
        <h2
          id="about-cta-heading"
          className={editorialHeadlineClass("section")}
        >
          {t("cta.title")}
        </h2>
        <p className={cn(EDITORIAL_STANDFIRST_CLASS, "max-w-lg")}>
          {t("cta.description")}
        </p>
        <Button asChild variant="accent" size="lg">
          <Link href="/auth/register">{t("cta.button")}</Link>
        </Button>
      </section>
    </article>
  );
}

/** Small sans subheading inside a chapter (value names, list captions). */
const SUBHEAD_CLASS =
  "font-sans! text-base! font-medium! leading-snug! tracking-normal! text-text";

function Section({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <EditorialChapter
      id={id}
      headingId={`about-${id}-heading`}
      marker={editorialNumber(index)}
      title={title}
    >
      {children}
    </EditorialChapter>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className={EDITORIAL_PROSE_CLASS}>{children}</p>;
}

function TitledList({
  items,
}: {
  items: { title: string; description: string }[];
}) {
  return (
    <div className="space-y-8">
      {items.map((item) => (
        <div key={item.title} className="space-y-2">
          <h3 className={SUBHEAD_CLASS}>{item.title}</h3>
          <P>{item.description}</P>
        </div>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="max-w-[38rem] list-disc space-y-2.5 pl-5 text-base leading-[1.75] text-text-muted marker:text-border-em">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
