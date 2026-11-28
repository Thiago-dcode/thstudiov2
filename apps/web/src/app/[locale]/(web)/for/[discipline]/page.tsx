import type { FullPlan } from "@repo/common-lib/types/plan";
import type { Portfolio } from "@repo/common-lib/types/portfolio";
import { artistPortfolioPath } from "@repo/common-lib/utils/artist-path";
import {
  EDITORIAL_COLUMN_CLASS,
  EDITORIAL_LABEL_CLASS,
  EDITORIAL_LINK_CLASS,
  EDITORIAL_PROSE_LINK_CLASS,
  EDITORIAL_STANDFIRST_CLASS,
  EditorialRule,
  editorialHeadlineClass,
  editorialNumber,
} from "@repo/ui/components/custom/editorial";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/components/shadcn/breadcrumb";
import { cn } from "@repo/ui/lib/utils";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { RegistrationCtaButton } from "@/lib/components/registration-cta-button";
import { isDirectoryOpen } from "@/lib/directory-visibility";
import { SITE_NAME } from "@/lib/seo/core";
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

  // Issue-style numbers for the sections that render, in page order (`FEATURES / 003`).
  let sectionCount = 0;
  const nextNumber = () => editorialNumber(++sectionCount);

  return (
    <article className="w-full">
      <JsonLd
        data={buildDisciplineLandingJsonLd(
          locale,
          disciplineLandingPath(key),
          {
            pageName: tMeta("title"),
            description: tMeta("description"),
            crumb: t("hero.label"),
          },
          faq,
        )}
      />

      {/* Mirrors the BreadcrumbList in the JSON-LD above: Google wants the trail visible too. */}
      <WebSection.Container className="max-w-6xl px-5 pt-8 tablet:px-10">
        <Breadcrumb>
          <BreadcrumbList className="gap-2 text-xs uppercase tracking-[0.24em] text-text-muted">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href="/"
                  className="text-xs uppercase tracking-[0.24em] text-text-muted transition-colors hover:text-text"
                >
                  {SITE_NAME}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="[&>svg]:size-3">
              <ChevronRight className="size-3" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xs font-normal uppercase tracking-[0.24em] text-text-muted">
                {t("hero.label")}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </WebSection.Container>

      <WebSection id="hero">
        <WebSection.Container className="flex max-w-4xl flex-col items-center gap-8 px-5 py-24 text-center tablet:px-10 tablet:py-32">
          <div className="flex flex-col items-center gap-6">
            <span aria-hidden="true" className="h-px w-12 bg-border-em" />
            <WebSection.Label>{t("hero.label")}</WebSection.Label>
          </div>
          <h1 className={`max-w-3xl ${editorialHeadlineClass("page")}`}>
            {t("hero.title")}
          </h1>
          <p className={EDITORIAL_STANDFIRST_CLASS}>{t("hero.lead")}</p>
          <div className="flex flex-col items-center gap-4 pt-2 phone-lg:flex-row phone-lg:gap-8">
            <RegistrationCtaButton intent="createPortfolio" size="lg" />
            {examples.length > 0 && (
              <a
                href="#examples"
                className={`inline-flex min-h-11 items-center ${EDITORIAL_LINK_CLASS}`}
              >
                {t("hero.seeExamples")}
              </a>
            )}
          </div>
        </WebSection.Container>
      </WebSection>

      {examples.length > 0 && (
        <Section id="examples">
          <WebSection.EditorialHeader
            className="mb-14 laptop:mb-20"
            label={t("examples.badge")}
            qualifier={nextNumber()}
            title={t("examples.title")}
            standfirst={t("examples.description")}
          />
          <ExamplesGrid portfolios={examples} />
          {directoryOpen && (
            <div className="mt-16 flex">
              <WebSection.ActionLink
                href="/portfolios"
                className={EDITORIAL_LINK_CLASS}
              >
                {t("examples.viewAll")}
              </WebSection.ActionLink>
            </div>
          )}
        </Section>
      )}

      {specialties.length > 0 && (
        <Section id="specialties">
          <WebSection.EditorialHeader
            className="mb-14 laptop:mb-20"
            label={t("specialties.badge")}
            qualifier={nextNumber()}
            title={t("specialties.title")}
            standfirst={t("specialties.description")}
          />
          <ul
            className={`flex max-w-[38rem] flex-wrap gap-x-3 gap-y-2 font-serif text-xl text-text tablet:text-2xl ${EDITORIAL_COLUMN_CLASS}`}
          >
            {specialties.map((s, i) => (
              <li key={s.slug} className="flex items-baseline gap-3">
                {i > 0 ? (
                  <span aria-hidden="true" className="text-text-muted/60">
                    /
                  </span>
                ) : null}
                {s.label}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="features">
        <WebSection.EditorialHeader
          className="mb-14 laptop:mb-20"
          label={t("features.badge")}
          qualifier={nextNumber()}
          title={t("features.title")}
          standfirst={t("features.description")}
        />
        <ul
          className={`grid grid-cols-1 gap-x-10 gap-y-12 tablet:grid-cols-2 ${EDITORIAL_COLUMN_CLASS}`}
        >
          {features.map((f) => (
            <li
              key={f.title}
              className="flex flex-col gap-3 border-t border-border pt-5"
            >
              <h3 className={editorialHeadlineClass("sub")}>{f.title}</h3>
              <p className="max-w-md text-base leading-relaxed text-text-muted">
                {f.description}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="guide">
        <WebSection.EditorialHeader
          className="mb-14 laptop:mb-20"
          label={t("guide.badge")}
          qualifier={nextNumber()}
          title={t("guide.title")}
          standfirst={t("guide.description")}
        />
        <ol
          className={`flex max-w-[38rem] flex-col gap-12 ${EDITORIAL_COLUMN_CLASS}`}
        >
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-6">
              <span
                aria-hidden="true"
                className={`w-10 shrink-0 pt-2 ${EDITORIAL_LABEL_CLASS}`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col gap-2">
                <h3 className={editorialHeadlineClass("sub")}>{step.title}</h3>
                <p className="text-base leading-relaxed text-text-muted">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {freePlan && (
        <Section id="free-plan">
          <WebSection.EditorialHeader
            className="mb-14 laptop:mb-20"
            label={t("freePlan.badge")}
            qualifier={nextNumber()}
            title={t("freePlan.title")}
            standfirst={t("freePlan.description")}
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
          <p
            className={`mt-10 text-sm text-text-muted ${EDITORIAL_COLUMN_CLASS}`}
          >
            {t("freePlan.upgradeNote")}
          </p>
        </Section>
      )}

      <Section id="faq">
        <WebSection.EditorialHeader
          className="mb-14 laptop:mb-20"
          label={t("faq.badge")}
          qualifier={nextNumber()}
          title={t("faq.title")}
          standfirst={t("faq.description")}
        />
        <dl
          className={`flex max-w-[38rem] flex-col divide-y divide-border border-y border-border ${EDITORIAL_COLUMN_CLASS}`}
        >
          {faq.map((item) => (
            <div key={item.question} className="flex flex-col gap-3 py-8">
              <dt className="font-serif text-xl leading-snug text-text tablet:text-2xl">
                {item.question}
              </dt>
              <dd className="text-base leading-relaxed text-text-muted">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
        <p
          className={`mt-10 text-base text-text-muted ${EDITORIAL_COLUMN_CLASS}`}
        >
          {t.rich("faq.more", {
            link: (chunks) => (
              <Link href="/faqs" className={EDITORIAL_PROSE_LINK_CLASS}>
                {chunks}
              </Link>
            ),
          })}
        </p>
      </Section>

      <WebSection id="cta">
        <WebSection.Container className="flex max-w-4xl flex-col items-center gap-8 px-5 py-24 text-center tablet:px-10 tablet:py-32">
          <EditorialRule />
          <h2 className={`max-w-3xl ${editorialHeadlineClass("section")}`}>
            {t("cta.title")}
          </h2>
          <p className={cn(EDITORIAL_STANDFIRST_CLASS, "max-w-lg")}>
            {t("cta.description")}
          </p>
          <RegistrationCtaButton intent="createPortfolio" size="lg" />
        </WebSection.Container>
      </WebSection>
    </article>
  );
}

/**
 * Every section shares the 6xl grid so the label and reading columns line up page-wide; the
 * editorial opening carries the hairline. Narrow content constrains itself (`max-w-[38rem]`).
 */
function Section({ id, children }: { id: string; children: ReactNode }) {
  return (
    <WebSection id={id}>
      <WebSection.Container className="max-w-6xl px-5 py-20 tablet:px-10 tablet:py-28">
        {children}
      </WebSection.Container>
    </WebSection>
  );
}

function ExamplesGrid({ portfolios }: { portfolios: Portfolio[] }) {
  return (
    // Centred flex rather than a grid: with one or two examples a 3-column grid left-aligns them
    // and the section reads as empty.
    <ul className="flex flex-wrap gap-x-8 gap-y-14">
      {portfolios.map((portfolio) => (
        <li
          key={portfolio.id}
          className="w-full min-w-0 phone-lg:w-[calc(50%-1rem)] laptop:w-[calc(33.333%-1.334rem)]"
        >
          <Link
            href={artistPortfolioPath(
              portfolio.artist.username,
              portfolio.slug,
            )}
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
    <dl
      className={`grid max-w-3xl grid-cols-2 gap-x-8 gap-y-10 phone-lg:grid-cols-3 tablet:grid-cols-5 ${EDITORIAL_COLUMN_CLASS}`}
    >
      {rows.map((row) => (
        // Term before value in the markup (valid <dl>), value shown on top.
        <div
          key={row.label}
          className="flex flex-col-reverse gap-3 border-t border-border pt-4"
        >
          <dt className={EDITORIAL_LABEL_CLASS}>{row.label}</dt>
          <dd className="font-serif text-4xl font-normal tabular-nums leading-none text-text">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
