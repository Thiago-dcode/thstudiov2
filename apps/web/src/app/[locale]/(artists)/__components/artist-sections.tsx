import {
  MAX_HIGHLIGHT_COLLECTIONS,
  MAX_HIGHLIGHT_PORTFOLIOS,
  MAX_HIGHLIGHT_SERVICES,
} from "@repo/common-lib/constants/highlights";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/shadcn/accordion";
import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CollectionCard } from "@/modules/collections/components/collection-card";
import { PortfolioCard } from "@/modules/portfolios/components/portfolio-card";
import userCollectionService from "@/modules/user-collections/user-collection.service";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import { ServiceCard } from "@/modules/user-services/components/service-card";
import userServiceService from "@/modules/user-services/user-service.service";
import { ArtistContactDialog } from "./artist-contact.dialog";

type ArtistSectionsProps = {
  username: string;
  displayName: string;
};

const SectionHeader = ({ title, href }: { title: string; href?: string }) => (
  <div className="mb-6 flex items-center justify-between phone-lg:mb-8 tablet:mb-10">
    <div className="flex items-center gap-3 phone-lg:gap-4">
      <span
        className="h-px w-5 bg-text phone-lg:w-8 opacity-50"
        aria-hidden="true"
      />
      <h3 className="text-lg! font-serif! font-normal! tracking-wider text-text uppercase">
        {title}
      </h3>
      <span
        className="h-px w-5 bg-text phone-lg:w-8 opacity-50"
        aria-hidden="true"
      />
    </div>
    {href && (
      <Link
        href={href}
        aria-label={`View all ${title.toLowerCase()}`}
        className="group inline-flex items-center gap-1.5 text-xs tracking-[0.15em]  uppercase transition-colors duration-300 hover:text-text"
      >
        <span className="hidden phone:inline">View all</span>
        <ArrowRight
          className="size-3 transition-transform duration-300 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    )}
  </div>
);

const SectionListContainer = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-2 tablet:grid-cols-3 gap-6 tablet-lg:grid-cols-4 laptop:grid-cols-5 tablet-lg:gap-12">{children}</div>

const ViewAllLink = ({ href, label }: { href: string; label: string }) => (
  <Link
    href={href}
    aria-label={label}
    className="mt-4 inline-flex items-center gap-1.5 text-xs tracking-[0.15em] text-text-muted/70 uppercase transition-colors duration-300 hover:text-text"
  >
    View all <ArrowRight className="size-3" aria-hidden="true" />
  </Link>
);

const EmptyState = ({ displayName }: { displayName: string }) => (
  <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 px-6 text-center">
    <p className="font-serif text-lg text-text-muted ">
      {displayName} hasn&apos;t published any work yet.
    </p>
    <p className="text-sm text-text-muted/70">
      Check back soon, or reach out to start a conversation.
    </p>
    <ArtistContactDialog>
      <button
        type="button"
        className="group inline-flex min-h-11 cursor-pointer items-center gap-2.5 border border-border/50 px-7 py-3 text-xs tracking-[0.15em] text-text-muted uppercase transition-all duration-300 hover:border-text/30 hover:text-text"
      >
        <Mail
          className="size-3.5 transition-transform duration-300 group-hover:-translate-y-px"
          aria-hidden="true"
        />
        <span>Get in touch</span>
      </button>
    </ArtistContactDialog>
  </div>
);

export const ArtistSections = async ({
  username,
  displayName,
}: ArtistSectionsProps) => {
  const [portfolioRes, collectionRes, serviceRes] = await Promise.all([
    userPortfolioService.getAllByUsername(username, {
      paginated: true,
      is_highlight: true,
      is_active: true,
      blocked: false,
      per_page: MAX_HIGHLIGHT_PORTFOLIOS,
    }),
    userCollectionService.getAllByUsername(username, {
      is_highlight: true,
      is_active: true,
      paginated: true,
      blocked: false,
      per_page: MAX_HIGHLIGHT_COLLECTIONS,
    }),
    userServiceService.getAllByUsername(username, {
      paginated: true,
      per_page: MAX_HIGHLIGHT_SERVICES,
      is_active: true,
      blocked: false,
      is_highlight: true,
    }),
  ]);

  const portfolios = portfolioRes.data ?? [];
  const collections = collectionRes.data ?? [];
  const services = serviceRes.data ?? [];
  const portfolioTotal =
    portfolioRes.error === null
      ? (portfolioRes.pagination?.total_count ?? portfolios.length)
      : portfolios.length;
  const collectionTotal =
    collectionRes.error === null
      ? (collectionRes.pagination?.total_count ?? collections.length)
      : collections.length;
  const serviceTotal =
    serviceRes.error === null
      ? (serviceRes.pagination?.total_count ?? services.length)
      : services.length;

  if (!portfolios.length && !collections.length && !services.length) {
    return <EmptyState displayName={displayName} />;
  }

  // Card item renderers — shared between the mobile accordion and desktop sections.
  const portfolioItems = (): ReactNode =>
    portfolios.map((portfolio) => (
      <Link
        key={portfolio.id}
        href={`/artists/${username}/portfolios/${portfolio.slug}`}
        className="block w-full min-w-0"
      >
        <PortfolioCard.Item portfolio={portfolio} />
      </Link>
    ));

  const collectionItems = (): ReactNode =>
    collections.map((collection) => (
      <Link
        key={collection.id}
        href={`/artists/${username}/collections/${collection.slug}`}
        className=""
      >
        <CollectionCard collection={collection} />
      </Link>
    ));

  const serviceItems = (): ReactNode =>
    services.map((service) => (
      <ServiceCard
        key={service.id}
        service={service}
        username={username}
        titleAs="h3"
      />
    ));

  return (
    <div className="mx-auto w-full max-w-(--breakpoint-desktop-lg) px-4 phone-lg:px-6 tablet:px-10 laptop:px-12">
      {/* Mobile: collapsible accordion */}
      <Accordion
        type="multiple"
        defaultValue={portfolios.length > 0 ? ["portfolios"] : []}
        className="space-y-2 phone-lg:hidden"
      >
        {portfolios.length > 0 && (
          <AccordionItem value="portfolios" className="border-border/30">
            <AccordionTrigger className="py-3 hover:no-underline">
              <span className="text-xs tracking-[0.25em] text-text-muted uppercase">
                Portfolios
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-4 phone:grid-cols-2">
                {portfolioItems()}
              </div>
              {portfolioTotal > MAX_HIGHLIGHT_PORTFOLIOS && (
                <ViewAllLink
                  href={`/artists/${username}/portfolios`}
                  label="View all portfolios"
                />
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {collections.length > 0 && (
          <AccordionItem value="collections" className="border-border/30">
            <AccordionTrigger className="py-3 hover:no-underline">
              <span className="text-xs tracking-[0.25em] text-text-muted uppercase">
                Collections
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-3">{collectionItems()}</div>
              {collectionTotal > MAX_HIGHLIGHT_COLLECTIONS && (
                <ViewAllLink
                  href={`/artists/${username}/collections`}
                  label="View all collections"
                />
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {services.length > 0 && (
          <AccordionItem value="services" className="border-border/30">
            <AccordionTrigger className="py-3 hover:no-underline">
              <span className="text-xs tracking-[0.25em] text-text-muted uppercase">
                Services
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-3">{serviceItems()}</div>
              {serviceTotal > MAX_HIGHLIGHT_SERVICES && (
                <ViewAllLink
                  href={`/artists/${username}/services`}
                  label="View all services"
                />
              )}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Desktop: regular sections */}
      <div className="hidden phone-lg:block tablet:space-y-28">
        {portfolios.length > 0 && (
          <section>
            <SectionHeader
              title="Portfolios"
              href={
                portfolioTotal > MAX_HIGHLIGHT_PORTFOLIOS
                  ? `/artists/${username}/portfolios`
                  : undefined
              }
            />
            <SectionListContainer>
              {portfolioItems()}
            </SectionListContainer>
          </section>
        )}

        {collections.length > 0 && (
          <section>
            <SectionHeader
              title="Collections"
              href={
                collectionTotal > MAX_HIGHLIGHT_COLLECTIONS
                  ? `/artists/${username}/collections`
                  : undefined
              }
            />
            <SectionListContainer>
              {collectionItems()}
            </SectionListContainer>
          </section>
        )}

        {services.length > 0 && (
          <section>
            <SectionHeader
              title="Services"
              href={
                serviceTotal > MAX_HIGHLIGHT_SERVICES
                  ? `/artists/${username}/services`
                  : undefined
              }
            />
            <SectionListContainer>
              {serviceItems()}
            </SectionListContainer>
          </section>
        )}
      </div>
    </div>
  );
};
