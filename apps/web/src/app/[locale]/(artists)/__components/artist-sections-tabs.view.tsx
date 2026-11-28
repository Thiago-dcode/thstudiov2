"use client";

import {
  MAX_HIGHLIGHT_COLLECTIONS,
  MAX_HIGHLIGHT_PORTFOLIOS,
  MAX_HIGHLIGHT_SERVICES,
} from "@repo/common-lib/constants/highlights";
import { EDITORIAL_LINK_CLASS } from "@repo/ui/components/custom/editorial";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/shadcn/tabs";
import { cn } from "@repo/ui/lib/utils";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { CollectionCard } from "@/modules/collections/components/collection-card";
import { PortfolioCard } from "@/modules/portfolios/components/portfolio-card";
import { ServiceCard } from "@/modules/user-services/components/service-card";
import { hasMoreThan, SECTION_GRID_CLASS } from "./artist-sections.constants";
import type { ArtistSectionsViewProps } from "./artist-sections.data";

type TabSection = {
  value: string;
  label: string;
  content: ReactNode;
  /** Set when the artist has more than the profile shows. */
  viewAll?: { href: string; ariaLabel: string };
};

/**
 * Tabbed layout for the artist highlights from 640px up (phones get the list's accordion). Every
 * panel stays mounted (hidden when inactive) so all card links are in the server HTML for
 * crawlers, not just the first tab's.
 */
export const ArtistSectionsTabsView = ({
  sections,
  username,
}: ArtistSectionsViewProps) => {
  const t = useTranslations("artists.sections");
  const portfolios = sections.portfolios.data ?? [];
  const collections = sections.collections.data ?? [];
  const services = sections.services.data ?? [];

  const tabs: TabSection[] = [];
  if (portfolios.length) {
    tabs.push({
      value: "portfolios",
      label: t("portfolios"),
      viewAll: hasMoreThan(sections.portfolios, MAX_HIGHLIGHT_PORTFOLIOS)
        ? {
            href: `/artists/${username}/portfolios`,
            ariaLabel: t("viewAllPortfolios"),
          }
        : undefined,
      content: (
        <div className={SECTION_GRID_CLASS}>
          {portfolios.map((portfolio) => (
            <Link
              key={portfolio.id}
              href={`/artists/${username}/portfolios/${portfolio.slug}`}
              className="block w-full min-w-0"
            >
              <PortfolioCard.Item portfolio={portfolio} />
            </Link>
          ))}
        </div>
      ),
    });
  }
  if (collections.length) {
    tabs.push({
      value: "collections",
      label: t("collections"),
      viewAll: hasMoreThan(sections.collections, MAX_HIGHLIGHT_COLLECTIONS)
        ? {
            href: `/artists/${username}/collections`,
            ariaLabel: t("viewAllCollections"),
          }
        : undefined,
      content: (
        <div className={SECTION_GRID_CLASS}>
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/artists/${username}/collections/${collection.slug}`}
              className="block w-full min-w-0"
            >
              <CollectionCard collection={collection} />
            </Link>
          ))}
        </div>
      ),
    });
  }
  if (services.length) {
    tabs.push({
      value: "services",
      label: t("services"),
      viewAll: hasMoreThan(sections.services, MAX_HIGHLIGHT_SERVICES)
        ? {
            href: `/artists/${username}/services`,
            ariaLabel: t("viewAllServices"),
          }
        : undefined,
      content: (
        <div className={SECTION_GRID_CLASS}>
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              username={username}
            />
          ))}
        </div>
      ),
    });
  }

  if (!tabs.length) return null;

  return (
    <Tabs defaultValue={tabs[0].value} className="w-full">
      {/* Editorial tab bar: a hairline with quiet uppercase labels; the active one gets an ink rule. */}
      <div className="mb-10 border-b border-border tablet:mb-14">
        <TabsList className="flex h-auto w-full justify-start gap-8 bg-transparent p-0 tablet:gap-12">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="relative min-h-11 shrink-0 cursor-pointer bg-transparent px-0 py-4 text-xs font-medium uppercase tracking-[0.24em] text-text-muted shadow-none transition-colors duration-300 hover:text-text focus-visible:ring-offset-0 data-[state=active]:bg-transparent data-[state=active]:text-text data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:-bottom-px data-[state=active]:after:h-px data-[state=active]:after:bg-text"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          forceMount
          className="mt-0 data-[state=inactive]:hidden motion-safe:data-[state=active]:animate-in motion-safe:data-[state=active]:fade-in-0 motion-safe:data-[state=active]:duration-500"
        >
          {tab.content}
          {tab.viewAll && (
            <div className="mt-12 tablet:mt-16">
              <Link
                href={tab.viewAll.href}
                aria-label={tab.viewAll.ariaLabel}
                className={cn(EDITORIAL_LINK_CLASS, "text-text-muted")}
              >
                {t("viewAll")}
              </Link>
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
};
