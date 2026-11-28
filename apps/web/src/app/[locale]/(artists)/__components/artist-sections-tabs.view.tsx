"use client";

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
import {
  ServiceCard,
  ServiceCardRow,
} from "@/modules/user-services/components/service-card";
import { SECTION_GRID_CLASS } from "./artist-sections.constants";
import type { ArtistSectionsViewProps } from "./artist-sections.data";

type TabSection = { value: string; label: string; content: ReactNode };

/**
 * Tabbed layout for the artist highlights, on every breakpoint. Every panel stays mounted (hidden
 * when inactive) so all card links are in the server HTML for crawlers, not just the first tab's.
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
      content: (
        <>
          {/* Rows read better than a cramped two-column grid on small phones. */}
          <div className="grid grid-cols-1 gap-3 phone-lg:hidden">
            {services.map((service) => (
              <ServiceCardRow
                key={service.id}
                service={service}
                username={username}
              />
            ))}
          </div>
          <div className={cn("hidden phone-lg:grid", SECTION_GRID_CLASS)}>
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                username={username}
              />
            ))}
          </div>
        </>
      ),
    });
  }

  if (!tabs.length) return null;

  return (
    <Tabs defaultValue={tabs[0].value} className="w-full">
      {/* Editorial tab bar: a hairline with quiet uppercase labels; the active one gets an ink rule. */}
      <div className="mb-10 border-b border-border tablet:mb-14">
        {/* Phones: the tabs share the bar's width with tighter tracking, so the labels fit at 375px
            without a scroll container. From 640px up they sit left with the full editorial tracking. */}
        <TabsList className="flex h-auto w-full justify-start gap-4 bg-transparent p-0 phone-lg:gap-8 tablet:gap-12">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="relative min-h-11 min-w-0 flex-1 cursor-pointer bg-transparent px-0 py-4 text-xs font-medium uppercase tracking-[0.14em] phone-lg:flex-none phone-lg:tracking-[0.24em] text-text-muted shadow-none transition-colors duration-300 hover:text-text focus-visible:ring-offset-0 data-[state=active]:bg-transparent data-[state=active]:text-text data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:-bottom-px data-[state=active]:after:h-px data-[state=active]:after:bg-text"
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
        </TabsContent>
      ))}
    </Tabs>
  );
};
