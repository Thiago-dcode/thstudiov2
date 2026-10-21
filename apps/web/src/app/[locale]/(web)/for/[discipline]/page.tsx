import type { FullPlan } from "@repo/common-lib/types/plan";
import type { Portfolio } from "@repo/common-lib/types/portfolio";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { RegistrationCtaButton } from "@/lib/components/registration-cta-button";
import { isDirectoryOpen } from "@/lib/directory-visibility";
import { buildDisciplineLandingJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import categoriesService from "@/modules/categories/categories.service";
import {
  DISCIPLINE_LANDINGS,
  type DisciplineLandingKey,
  disciplineLandingPath,
  isDisciplineLandingKey,
} from "@/modules/landings/discipline-landings";
import plansService from "@/modules/plans/plans.service";
import { PortfolioCard } from "@/modules/portfolios/components/portfolio-card";
import portfolioService from "@/modules/portfolios/portfolio.service";
import { reportSectionError } from "../../_components/landing/section-error";
import { WebSection } from "../../_components/landing/web-section";

type Props = { params: Promise<{ locale: string; discipline: string }> };

const EXAMPLES_LIMIT = 6;

type FaqItem = { question: string; answer: string };
type TextItem = { title: string; description: string };

const resolveKey = async (params: Props["params"]) => {
  const { locale, discipline } = await params;
  if (!isDisciplineLandingKey(discipline)) notFound();
  return { locale, key: discipline };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, key } = await resolveKey(params);
  const t = await getTranslations(`forDiscipline.${key}.metadata`);
  return buildStaticPageMetadata({
    path: disciplineLandingPath(key),
    title: t("title"),
    description: t("description"),
    locale,
  });
}

/** The discipline's specialties: its active sub-categories, in catalogue order. */
async function getSpecialtySlugs(key: DisciplineLandingKey) {
  const response = await categoriesService.getAllActive();
  reportSectionError(`for-${key}-categories`, response);
  const all = response.data ?? [];
  const parent = all.find(
    (c) => c.slug === DISCIPLINE_LANDINGS[key].categorySlug,
  );
  if (!parent) return { parentSlug: null, specialtySlugs: [] };
  return {
    parentSlug: parent.slug,
    specialtySlugs: all
      .filter((c) => c.parent_id === parent.id)
      .map((c) => c.slug),
  };
}

export default async function DisciplineLandingPage({ params }: Props) {
  const { locale, key } = await resolveKey(params);
  // Only the examples depend on the categories; everything else starts at once.
  const [
    t,
    tMeta,
    { parentSlug, specialtySlugs },
    freePlanResponse,
    directoryOpen,
  ] = await Promise.all([
    getTranslations(`forDiscipline.${key}`),
    getTranslations(`forDiscipline.${key}.metadata`),
    getSpecialtySlugs(key),
    plansService.getFree(),
    isDirectoryOpen(),
  ]);
  const examplesResponse = parentSlug
    ? await portfolioService.findPublicByCategories(
        [parentSlug, ...specialtySlugs],
        EXAMPLES_LIMIT,
      )
    : null;
  if (examplesResponse) {
    reportSectionError(`for-${key}-examples`, examplesResponse);
  }
  reportSectionError(`for-${key}-free-plan`, freePlanResponse);
  const examples = examplesResponse?.data ?? [];
  const freePlan = freePlanResponse.data;

  // Only specialties that exist in the catalogue are listed, in catalogue order and the copy's wording.
  const specialtyLabels = new Map(
    (t.raw("specialties.items") as { slug: string; label: string }[]).map(
      (s) => [s.slug, s.label],
    ),
  );
  const specialties = specialtySlugs.flatMap((slug) => {
    const label = specialtyLabels.get(slug);
    return label ? [{ slug, label }] : [];
  });

  const features = t.raw("features.items") as TextItem[];
  const steps = t.raw("guide.steps") as TextItem[];
  const faq = t.raw("faq.items") as FaqItem[];

  return (
    <article className="w-full">
      <JsonLd
        data={buildDisciplineLandingJsonLd(
          locale,
          disciplineLandingPath(key),
          { pageName: tMeta("title"), description: tMeta("description") },
          faq,
        )}
      />

      <WebSection id="hero">
        <WebSection.Container className="flex max-w-3xl flex-col items-center gap-8 px-6 py-20 text-center tablet:px-10 tablet:py-28">
          <div className="flex flex-col items-center gap-5">
            <span aria-hidden="true" className="h-px w-12 bg-border-em" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
              {t("hero.label")}
            </span>
          </div>
          <h1 className="max-w-2xl font-serif text-4xl font-bold leading-[1.05] tracking-tight tablet:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-text-muted tablet:text-lg">
            {t("hero.lead")}
          </p>
          <div className="flex flex-col items-center gap-4 pt-2 phone-lg:flex-row phone-lg:gap-8">
            <RegistrationCtaButton intent="createPortfolio" size="lg" />
            {examples.length > 0 && (
              <a
                href="#examples"
                className="inline-flex min-h-11 items-center text-sm tracking-wider text-text-muted underline-offset-4 transition-colors hover:text-text hover:underline"
              >
                {t("hero.seeExamples")}
              </a>
            )}
          </div>
        </WebSection.Container>
      </WebSection>

      {examples.length > 0 && (
        <Section id="examples">
          <WebSection.Header
            badge={t("examples.badge")}
            title={t("examples.title")}
            description={t("examples.description")}
          />
          <ExamplesGrid portfolios={examples} />
          {directoryOpen && (
            <div className="mt-12 flex justify-center">
              <WebSection.ActionLink href="/portfolios">
                {t("examples.viewAll")}
              </WebSection.ActionLink>
            </div>
          )}
        </Section>
      )}

      {specialties.length > 0 && (
        <Section id="specialties" narrow>
          <WebSection.Header
            badge={t("specialties.badge")}
            title={t("specialties.title")}
            description={t("specialties.description")}
          />
          <ul className="flex flex-wrap justify-center gap-3">
            {specialties.map((s) => (
              <li
                key={s.slug}
                className="border border-fg-2 px-4 py-2 text-sm tracking-wider text-text"
              >
                {s.label}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="features">
        <WebSection.Header
          badge={t("features.badge")}
          title={t("features.title")}
          description={t("features.description")}
        />
        <ul className="mx-auto grid max-w-5xl grid-cols-1 gap-x-12 gap-y-12 tablet:grid-cols-2 laptop:grid-cols-3">
          {features.map((f) => (
            <li key={f.title} className="flex flex-col gap-3">
              <h3 className="font-serif text-lg font-semibold tracking-tight text-text">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-text-muted">
                {f.description}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="guide" narrow>
        <WebSection.Header
          badge={t("guide.badge")}
          title={t("guide.title")}
          description={t("guide.description")}
        />
        <ol className="flex flex-col gap-10">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-6">
              <span
                aria-hidden="true"
                className="font-serif text-2xl leading-none text-text-muted tabular-nums"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-text">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {freePlan && (
        <Section id="free-plan" narrow>
          <WebSection.Header
            badge={t("freePlan.badge")}
            title={t("freePlan.title")}
            description={t("freePlan.description")}
          />
          <FreePlanLimits
            plan={freePlan}
            labels={{
              portfolios: t("freePlan.portfolios"),
              collections: t("freePlan.collections"),
              services: t("freePlan.services"),
              storage: t("freePlan.storage"),
              aiCredits: t("freePlan.aiCredits"),
              unlimited: t("freePlan.unlimited"),
            }}
          />
          <p className="mt-8 text-center text-sm text-text-muted">
            {t("freePlan.upgradeNote")}
          </p>
        </Section>
      )}

      <Section id="faq" narrow>
        <WebSection.Header
          badge={t("faq.badge")}
          title={t("faq.title")}
          description={t("faq.description")}
        />
        <dl className="flex flex-col divide-y divide-fg-2 border-y border-fg-2">
          {faq.map((item) => (
            <div key={item.question} className="flex flex-col gap-2 py-6">
              <dt className="text-base font-semibold text-text">
                {item.question}
              </dt>
              <dd className="text-sm leading-relaxed text-text-muted">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-center text-sm text-text-muted">
          {t.rich("faq.more", {
            link: (chunks) => (
              <Link
                href="/faqs"
                className="text-text underline underline-offset-4"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </Section>

      <WebSection id="cta">
        <WebSection.Container className="flex max-w-3xl flex-col items-center gap-8 px-6 py-20 text-center tablet:px-10 tablet:py-28">
          <span aria-hidden="true" className="h-px w-12 bg-border-em" />
          <h2 className="max-w-2xl font-serif text-3xl font-bold leading-tight tracking-tight tablet:text-5xl">
            {t("cta.title")}
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-text-muted tablet:text-lg">
            {t("cta.description")}
          </p>
          <RegistrationCtaButton intent="createPortfolio" size="lg" />
        </WebSection.Container>
      </WebSection>
    </article>
  );
}

function Section({
  id,
  narrow = false,
  children,
}: {
  id: string;
  narrow?: boolean;
  children: ReactNode;
}) {
  return (
    <WebSection id={id} className="border-t border-fg-2">
      <WebSection.Container
        className={
          narrow
            ? "max-w-3xl px-6 py-20 tablet:px-10 tablet:py-28"
            : "px-6 py-20 tablet:px-10 tablet:py-28"
        }
      >
        {children}
      </WebSection.Container>
    </WebSection>
  );
}

function ExamplesGrid({ portfolios }: { portfolios: Portfolio[] }) {
  return (
    // Centred flex rather than a grid: with one or two examples a 3-column grid left-aligns them
    // and the section reads as empty.
    <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-8">
      {portfolios.map((portfolio) => (
        <li
          key={portfolio.id}
          className="w-full min-w-0 phone-lg:w-[calc(50%-1rem)] laptop:w-[calc(33.333%-1.334rem)]"
        >
          <Link
            href={`/artists/${encodeURIComponent(portfolio.artist.username)}/portfolios/${encodeURIComponent(portfolio.slug)}`}
            className="block w-full min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <PortfolioCard.Item portfolio={portfolio} className="h-full" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** -1 means unlimited in the plan catalogue. */
const formatLimit = (value: number, unlimited: string) =>
  value < 0 ? unlimited : String(value);

const formatStorage = (mb: number, unlimited: string) =>
  mb < 0
    ? unlimited
    : mb >= 1024
      ? `${Number((mb / 1024).toFixed(1))} GB`
      : `${mb} MB`;

type PlanLimitLabels = {
  portfolios: string;
  collections: string;
  services: string;
  storage: string;
  aiCredits: string;
  unlimited: string;
};

/** The free plan's limits, read from the live plan catalogue so the page never states stale numbers. */
function FreePlanLimits({
  plan,
  labels,
}: {
  plan: FullPlan;
  labels: PlanLimitLabels;
}) {
  const rows = [
    {
      label: labels.portfolios,
      value: formatLimit(plan.max_portfolios, labels.unlimited),
    },
    {
      label: labels.collections,
      value: formatLimit(plan.max_collections, labels.unlimited),
    },
    {
      label: labels.services,
      value: formatLimit(plan.max_services, labels.unlimited),
    },
    {
      label: labels.storage,
      value: formatStorage(plan.storage_limit_mb, labels.unlimited),
    },
    {
      label: labels.aiCredits,
      value: formatLimit(plan.ai_credits, labels.unlimited),
    },
  ];

  return (
    <dl className="mx-auto grid max-w-2xl grid-cols-2 gap-px border border-fg-2 bg-fg-2 phone-lg:grid-cols-3 tablet:grid-cols-5">
      {rows.map((row) => (
        // Term before value in the markup (valid <dl>), value shown on top.
        <div
          key={row.label}
          className="flex flex-col-reverse items-center gap-1 bg-bg px-4 py-6 text-center"
        >
          <dt className="text-xs tracking-wider text-text-muted">
            {row.label}
          </dt>
          <dd className="font-serif text-2xl font-semibold tabular-nums text-text">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
