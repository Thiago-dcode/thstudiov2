import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CollectionCard } from "@/modules/collections/components/collection-card";
import { PortfolioCard } from "@/modules/portfolios/components/portfolio-card";
import { ServiceCard } from "@/modules/user-services/components/service-card";
import portfolioService from "@/modules/portfolios/portfolio.service";
import userCollectionService from "@/modules/user-collections/user-collection.service";
import userServiceService from "@/modules/user-services/user-service.service";

type ArtistSectionsProps = {
  username: string;
  userId: number;
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
  userId,
}: ArtistSectionsProps) => {
  const [portfolioRes, collectionRes, serviceRes] = await Promise.all([
    portfolioService.findAll({
      user_id: userId,
      paginated: false,
      is_highlight: true,
    }),
    userCollectionService.getAllByUsername(username, { is_highlight: true }),
    userServiceService.getAllByUsername(username),
  ]);

  const portfolios = portfolioRes.data ?? [];
  const collections = collectionRes.data ?? [];
  const services = (serviceRes.data ?? []).filter((s) => s.is_active);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 phone-lg:px-6 tablet:px-12 space-y-16 phone-lg:space-y-20 tablet:space-y-28">
      {portfolios.length > 0 && (
        <section>
          <SectionHeader
            title="Portfolios"
            href={`/artists/${username}/portfolios`}
          />
          <div className="grid grid-cols-2 gap-3 phone-lg:grid-cols-3 phone-lg:gap-4 tablet-lg:grid-cols-4 tablet-lg:gap-5">
            {portfolios.map((portfolio) => (
              <PortfolioCard
                key={portfolio.id}
                portfolio={portfolio}
                username={username}
              />
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
          <div className="grid grid-cols-2 gap-3 phone-lg:grid-cols-3 phone-lg:gap-4 tablet-lg:grid-cols-4 tablet-lg:gap-5">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                username={username}
              />
            ))}
          </div>
        </section>
      )}

      {services.length > 0 && (
        <section>
          <SectionHeader
            title="Services"
            href={
              services.length > 1 ? `/artists/${username}/services` : undefined
            }
          />
          <div className="grid grid-cols-1 gap-4 phone-lg:grid-cols-2 phone-lg:gap-5 tablet-lg:grid-cols-3 tablet-lg:gap-6">
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
  );
};
