import {
  MAX_HIGHLIGHT_COLLECTIONS,
  MAX_HIGHLIGHT_PORTFOLIOS,
  MAX_HIGHLIGHT_SERVICES,
} from "@repo/common-lib/constants/highlights";
import { editorialHeadlineClass } from "@repo/ui/components/custom/editorial";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/shadcn/accordion";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { CollectionCard } from "@/modules/collections/components/collection-card";
import { PortfolioCard } from "@/modules/portfolios/components/portfolio-card";
import {
  ServiceCard,
  ServiceCardRow,
} from "@/modules/user-services/components/service-card";
import { hasMoreThan, SECTION_GRID_CLASS } from "./artist-sections.constants";
import type { ArtistSectionsViewProps } from "./artist-sections.data";

type ListSection = {
  value: string;
  label: string;
  /** Accordion content on small phones. */
  mobile: ReactNode;
  /** Grid content from 640px up. */
  desktop: ReactNode;
  /** Set when the artist has more than the profile shows. */
  viewAll?: { href: string; ariaLabel: string };
};

/**
 * Stacked layout: an accordion on small phones, editorial sections from 640px up. `mobileOnly`
 * renders just the accordion, for layouts that bring their own view from 640px up (tabs).
 */
export const ArtistSectionsListView = async ({
  sections,
  username,
  mobileOnly = false,
}: ArtistSectionsViewProps & { mobileOnly?: boolean }) => {
  const t = await getTranslations("artists.sections");
  const portfolios = sections.portfolios.data ?? [];
  const collections = sections.collections.data ?? [];
  const services = sections.services.data ?? [];

  const portfolioCards = portfolios.map((portfolio) => (
    <Link
      key={portfolio.id}
      href={`/artists/${username}/portfolios/${portfolio.slug}`}
      className="block w-full min-w-0"
    >
      <PortfolioCard.Item portfolio={portfolio} />
    </Link>
  ));
  const collectionCards = collections.map((collection) => (
    <Link
      key={collection.id}
      href={`/artists/${username}/collections/${collection.slug}`}
    >
      <CollectionCard collection={collection} />
    </Link>
  ));

  const list: ListSection[] = [];
  if (portfolios.length) {
    list.push({
      value: "portfolios",
      label: t("portfolios"),
      viewAll: hasMoreThan(sections.portfolios, MAX_HIGHLIGHT_PORTFOLIOS)
        ? {
            href: `/artists/${username}/portfolios`,
            ariaLabel: t("viewAllPortfolios"),
          }
        : undefined,
      mobile: (
        <div className="grid grid-cols-1 gap-4 phone:grid-cols-2">
          {portfolioCards}
        </div>
      ),
      desktop: portfolioCards,
    });
  }
  if (collections.length) {
    list.push({
      value: "collections",
      label: t("collections"),
      viewAll: hasMoreThan(sections.collections, MAX_HIGHLIGHT_COLLECTIONS)
        ? {
            href: `/artists/${username}/collections`,
            ariaLabel: t("viewAllCollections"),
          }
        : undefined,
      mobile: <div className="grid grid-cols-1 gap-3">{collectionCards}</div>,
      desktop: collectionCards,
    });
  }
  if (services.length) {
    list.push({
      value: "services",
      label: t("services"),
      viewAll: hasMoreThan(sections.services, MAX_HIGHLIGHT_SERVICES)
        ? {
            href: `/artists/${username}/services`,
            ariaLabel: t("viewAllServices"),
          }
        : undefined,
      mobile: (
        <div className="grid grid-cols-1 gap-3">
          {services.map((service) => (
            <ServiceCardRow
              key={service.id}
              service={service}
              username={username}
            />
          ))}
        </div>
      ),
      desktop: services.map((service) => (
        <ServiceCard key={service.id} service={service} username={username} />
      )),
    });
  }

  return (
    <>
      {/* Mobile: collapsible accordion. Only portfolios open on landing (or the first section
          when there are none), so the rest of the profile stays one tap away. */}
      <Accordion
        type="multiple"
        defaultValue={list[0] ? [list[0].value] : []}
        className="space-y-8 phone-lg:hidden"
      >
        {list.map((section) => (
          <AccordionItem
            key={section.value}
            value={section.value}
            className="border-border/30"
          >
            <AccordionTrigger className="py-3 hover:no-underline">
              <span className="text-xs tracking-[0.25em] text-text-muted uppercase">
                {section.label}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {section.mobile}
              {section.viewAll && (
                <Link
                  href={section.viewAll.href}
                  aria-label={section.viewAll.ariaLabel}
                  className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-xs uppercase tracking-[0.24em] text-text-muted transition-colors duration-300 hover:text-text"
                >
                  {t("viewAll")}{" "}
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Desktop: regular sections */}
      {!mobileOnly && (
        <div className="hidden phone-lg:block tablet:space-y-40">
          {list.map((section) => (
            <section key={section.value}>
              {/* Editorial opening: a hairline and the section title. h2: these are the top-level
                sections of the artist profile, whose only other heading is the identity h1. */}
              <div className="mb-8 flex items-end justify-between gap-6 border-t border-border pt-6 tablet:mb-12">
                <h2 className={editorialHeadlineClass("sub")}>
                  {section.label}
                </h2>
                {section.viewAll && (
                  <Link
                    href={section.viewAll.href}
                    aria-label={section.viewAll.ariaLabel}
                    className="group inline-flex min-h-11 items-center gap-1.5 text-xs uppercase tracking-[0.24em] text-text-muted transition-colors duration-300 hover:text-text"
                  >
                    <span className="hidden phone:inline">{t("viewAll")}</span>
                    <ArrowRight
                      className="size-3 transition-transform duration-300 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                )}
              </div>
              <div className={SECTION_GRID_CLASS}>{section.desktop}</div>
            </section>
          ))}
        </div>
      )}
    </>
  );
};
