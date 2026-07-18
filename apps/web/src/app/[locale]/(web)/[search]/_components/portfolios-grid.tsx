import type { Portfolio } from "@repo/common-lib/types/portfolio";
import { Link } from "@/i18n/navigation";
import { PortfolioCard } from "@/modules/portfolios/components/portfolio-card";

type PortfoliosGridProps = {
  portfolios: Portfolio[];
};

export function PortfoliosGrid({ portfolios }: PortfoliosGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 phone:grid-cols-2 tablet:grid-cols-3 tablet:gap-4 tablet-lg:grid-cols-4 laptop:grid-cols-5 laptop:gap-5">
      {portfolios.map((portfolio) => (
        <li
          key={portfolio.id}
          className="mx-auto w-full max-w-72 min-w-0 phone:mx-0 phone:max-w-none"
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
