import Link from "next/link";
import portfolioService from "../portfolio.service";
import { PortfolioCard } from "./portfolio-card";

export const UserPortfoliosSection = async ({
  userId,
  username,
  displayName,
  isHighlight,
}: {
  userId: number;
  username: string;
  displayName: string;
  isHighlight?: boolean;
}) => {
  const response = await portfolioService.findAll({
    user_id: userId,
    paginated: false,
    ...(isHighlight !== undefined && { is_highlight: isHighlight }),
  });

  if (response.error || !response.data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm tracking-wide text-text-muted/70">
          {displayName} has no portfolios yet&hellip;
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 tablet:grid-cols-4 tablet:gap-5">
      {response.data.map((portfolio) => (
        <Link
          key={portfolio.id}
          href={`/artists/${username}/portfolios/${portfolio.slug}`}
          className="block w-full min-w-0"
        >
          <PortfolioCard.Item portfolio={portfolio} />
        </Link>
      ))}
    </div>
  );
};
