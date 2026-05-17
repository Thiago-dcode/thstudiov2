import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CollectionCard } from "@/modules/collections/components/collection-card";
import { PortfolioCard } from "@/modules/portfolios/components/portfolio-card";
import { ServiceCard } from "@/modules/user-services/components/service-card";
import userCollectionService from "@/modules/user-collections/user-collection.service";
import userServiceService from "@/modules/user-services/user-service.service";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/shadcn/accordion";

type ArtistSectionsProps = {
  username: string;
};

const SectionHeader = ({ title, href }: { title: string; href?: string }) => (
  <div className="flex items-center justify-between mb-6 phone-lg:mb-8 tablet:mb-10">
    <div className="flex items-center gap-3 phone-lg:gap-4">
      <div className="w-5 phone-lg:w-8 h-px bg-border/60" />
      <h2 className="text-xs uppercase tracking-[0.25em] text-text-muted">
        {title}
      </h2>
      <div className="w-5 phone-lg:w-8 h-px bg-border/60" />
    </div>
    {href && (
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-text-muted/70 hover:text-text transition-colors duration-300 group"
      >
        <span className="hidden phone:inline">View all</span>
        <ArrowRight className="size-3 transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>
    )}
  </div>
);

export const ArtistSections = async ({
  username,
}: ArtistSectionsProps) => {
  const [portfolioRes, collectionRes, serviceRes] = await Promise.all([
    userPortfolioService.getAllByUsername(username, {
      paginated: true,
      is_highlight: true,
      is_active: true,
      blocked: false,
      per_page: 3,
    }),
    userCollectionService.getAllByUsername(username, {
      is_highlight: true,
      is_active: true,
      paginated: true,
      blocked: false,
      per_page: 4,
    }),
    userServiceService.getAllByUsername(username, {
      paginated: true,
      per_page: 4,
      is_active: true,
      blocked: false,
      is_highlight: true,
    }),
  ]);

  const portfolios = portfolioRes.data ?? [];
  const collections = collectionRes.data ?? [];
  const services = serviceRes.data ?? [];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 phone-lg:px-6 tablet:px-12">
      {/* Mobile: collapsible accordion */}
      <Accordion
        type="multiple"
        defaultValue={portfolios.length > 0 ? ["portfolios"] : []}
        className="space-y-2 phone-lg:hidden"
      >
        {portfolios.length > 0 && (
          <AccordionItem value="portfolios" className="border-border/30">
            <AccordionTrigger className="py-3 hover:no-underline">
              <span className="text-xs uppercase tracking-[0.25em] text-text-muted">
                Portfolios
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-4 phone:grid-cols-2">
                {portfolios.map((portfolio) => (
                  <Link
                    key={portfolio.id}
                    href={`/artists/${username}/portfolios/${portfolio.slug}`}
                  >
                    <PortfolioCard
                      portfolio={portfolio}
                      sizes="(max-width: 480px) 100vw, (max-width: 640px) 50vw, 34vw"
                    />
                  </Link>
                ))}
              </div>
              <Link
                href={`/artists/${username}/portfolios`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-text-muted/70 hover:text-text transition-colors duration-300"
              >
                View all <ArrowRight className="size-3" />
              </Link>
            </AccordionContent>
          </AccordionItem>
        )}

        {collections.length > 0 && (
          <AccordionItem value="collections" className="border-border/30">
            <AccordionTrigger className="py-3 hover:no-underline">
              <span className="text-xs uppercase tracking-[0.25em] text-text-muted">
                Collections
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-3">
                {collections.map((collection) => (
                  <Link
                    key={collection.id}
                    href={`/artists/${username}/collections/${collection.slug}`}
                  >
                    <CollectionCard collection={collection} />
                  </Link>
                ))}
              </div>
              <Link
                href={`/artists/${username}/collections`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-text-muted/70 hover:text-text transition-colors duration-300"
              >
                View all <ArrowRight className="size-3" />
              </Link>
            </AccordionContent>
          </AccordionItem>
        )}

        {services.length > 0 && (
          <AccordionItem value="services" className="border-border/30">
            <AccordionTrigger className="py-3 hover:no-underline">
              <span className="text-xs uppercase tracking-[0.25em] text-text-muted">
                Services
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-3">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    username={username}
                    titleAs="h3"
                  />
                ))}
              </div>
              {services.length > 1 && (
                <Link
                  href={`/artists/${username}/services`}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-text-muted/70 hover:text-text transition-colors duration-300"
                >
                  View all <ArrowRight className="size-3" />
                </Link>
              )}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Desktop: regular sections */}
      <div className="hidden phone-lg:block space-y-20 tablet:space-y-28">
        {portfolios.length > 0 && (
          <section>
            <SectionHeader
              title="Portfolios"
              href={`/artists/${username}/portfolios`}
            />
            <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3 tablet-lg:gap-5">
              {portfolios.map((portfolio) => (
                <Link
                  key={portfolio.id}
                  href={`/artists/${username}/portfolios/${portfolio.slug}`}
                >
                  <PortfolioCard
                    portfolio={portfolio}
                    sizes="(max-width: 1024px) 50vw, 34vw"
                  />
                </Link>
              ))}
            </div>
          </section>
        )}

        {collections.length > 0 && (
          <section>
            <SectionHeader
              title="Collections"
              href={`/artists/${username}/collections`}
            />
            <div className="grid grid-cols-3 gap-4 tablet-lg:grid-cols-4 tablet-lg:gap-5">
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/artists/${username}/collections/${collection.slug}`}
                >
                  <CollectionCard collection={collection} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {services.length > 0 && (
          <section>
            <SectionHeader
              title="Services"
              href={
                services.length > 1
                  ? `/artists/${username}/services`
                  : undefined
              }
            />
            <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3 tablet:gap-4 tablet-lg:grid-cols-4 tablet-lg:gap-5">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  username={username}
                  titleAs="h3"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
