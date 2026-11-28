import { editorialHeadlineClass } from "@repo/ui/components/custom/editorial";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/shadcn/accordion";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { CollectionCard } from "@/modules/collections/components/collection-card";
import { PortfolioCard } from "@/modules/portfolios/components/portfolio-card";
import {
  ServiceCard,
  ServiceCardRow,
} from "@/modules/user-services/components/service-card";
import { SECTION_GRID_CLASS } from "./artist-sections.constants";
import type { ArtistSectionsViewProps } from "./artist-sections.data";

type ListSection = {
  value: string;
  label: string;
  /** Accordion content on small phones. */
  mobile: ReactNode;
  /** Grid content from 640px up. */
  desktop: ReactNode;
};

/** Stacked layout: an accordion on small phones, editorial sections from 640px up. */
export const ArtistSectionsListView = async ({
  sections,
  username,
}: ArtistSectionsViewProps) => {
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
      mobile: <div className="grid grid-cols-1 gap-3">{collectionCards}</div>,
      desktop: collectionCards,
    });
  }
  if (services.length) {
    list.push({
      value: "services",
      label: t("services"),
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
      {/* Mobile: collapsible accordion, every section open on landing. */}
      <Accordion
        type="multiple"
        defaultValue={list.map((section) => section.value)}
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
            <AccordionContent>{section.mobile}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Desktop: regular sections */}
      <div className="hidden phone-lg:block tablet:space-y-40">
        {list.map((section) => (
          <section key={section.value}>
            {/* Editorial opening: a hairline and the section title. h2: these are the top-level
                sections of the artist profile, whose only other heading is the identity h1. */}
            <div className="mb-8 border-t border-border pt-6 tablet:mb-12">
              <h2 className={editorialHeadlineClass("sub")}>{section.label}</h2>
            </div>
            <div className={SECTION_GRID_CLASS}>{section.desktop}</div>
          </section>
        ))}
      </div>
    </>
  );
};
