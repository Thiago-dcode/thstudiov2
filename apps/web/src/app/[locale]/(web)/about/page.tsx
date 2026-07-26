import { Button } from "@repo/ui/components/shadcn/button";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { buildOrganizationJsonLd, JsonLd } from "@/lib/seo/json-ld";
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
    description: t("description"),
    locale,
    ogType: "article",
  });
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  const tSeo = await getTranslations("seo");

  const valueItems = t.raw("values.items") as {
    title: string;
    description: string;
  }[];
  const whyItems = t.raw("why.items") as string[];
  const whoItems = t.raw("who.items") as string[];
  const whatParagraphs = t.raw("what.paragraphs") as string[];
  const visionParagraphs = t.raw("vision.paragraphs") as string[];
  const creatorParagraphs = t.raw("creator.paragraphs") as string[];
  const websiteItems = t.raw("bridge.websiteItems") as string[];
  const socialItems = t.raw("bridge.socialItems") as string[];

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-20 tablet:px-10 tablet:py-28">
      <JsonLd data={buildOrganizationJsonLd(tSeo("organizationDescription"))} />
      <header className="space-y-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
          {t("hero.label")}
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-text tablet:text-4xl">
          {t("hero.title")}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          {t("hero.lead")}
        </p>
      </header>

      <Section id="what" title={t("what.title")}>
        {whatParagraphs.map((paragraph) => (
          <P key={paragraph}>{paragraph}</P>
        ))}
      </Section>

      <Section id="bridge" title={t("bridge.title")}>
        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-text">
              {t("bridge.websiteLabel")}
            </h3>
            <BulletList items={websiteItems} />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-text">
              {t("bridge.socialLabel")}
            </h3>
            <BulletList items={socialItems} />
          </div>
          <P>{t("bridge.closing")}</P>
        </div>
      </Section>

      <Section id="mission" title={t("mission.title")}>
        <p className="max-w-2xl text-base font-medium leading-relaxed text-text">
          {t("mission.statement")}
        </p>
        <P>{t("mission.body")}</P>
      </Section>

      <Section id="vision" title={t("vision.title")}>
        {visionParagraphs.map((paragraph) => (
          <P key={paragraph}>{paragraph}</P>
        ))}
      </Section>

      <Section id="values" title={t("values.title")}>
        <div className="space-y-8">
          {valueItems.map((item) => (
            <div key={item.title} className="space-y-2">
              <h3 className="text-sm font-medium text-text">{item.title}</h3>
              <P>{item.description}</P>
            </div>
          ))}
        </div>
      </Section>

      <Section id="why" title={t("why.title")}>
        <P>{t("why.intro")}</P>
        <BulletList items={whyItems} />
      </Section>

      <Section id="who" title={t("who.title")}>
        <p className="text-sm leading-relaxed text-text-muted">
          {t("who.intro")}
        </p>
        <BulletList items={whoItems} />
        <P>{t("who.closing")}</P>
      </Section>

      <Section id="philosophy" title={t("philosophy.title")}>
        <p className="max-w-2xl text-base font-medium leading-relaxed text-text">
          {t("philosophy.question")}
        </p>
        <P>{t("philosophy.answer")}</P>
      </Section>

      <Section id="creator" title={t("creator.title")}>
        {creatorParagraphs.map((paragraph) => (
          <P key={paragraph}>{paragraph}</P>
        ))}
      </Section>

      <section
        aria-labelledby="about-cta-heading"
        className="mt-16 space-y-4 border-t border-fg-2 pt-16"
      >
        <h2
          id="about-cta-heading"
          className="text-xl font-semibold tracking-tight text-text tablet:text-2xl"
        >
          {t("cta.title")}
        </h2>
        <P>{t("cta.description")}</P>
        <Button asChild variant="accent" size="sm">
          <Link href="/auth/register">{t("cta.button")}</Link>
        </Button>
      </section>
    </article>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  const headingId = `about-${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="mt-16 space-y-4 first:mt-16"
    >
      <h2
        id={headingId}
        className="text-xl font-semibold tracking-tight text-text tablet:text-2xl"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: ReactNode }) {
  return (
    <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
      {children}
    </p>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="max-w-2xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-text-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
