import "server-only";
import {
  MAX_HIGHLIGHT_COLLECTIONS,
  MAX_HIGHLIGHT_PORTFOLIOS,
  MAX_HIGHLIGHT_SERVICES,
} from "@repo/common-lib/constants/highlights";
import userCollectionService from "@/modules/user-collections/user-collection.service";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import userServiceService from "@/modules/user-services/user-service.service";

/** The highlighted, public portfolios, collections and services shown on an artist profile. */
export const getArtistHighlights = async (username: string) => {
  const [portfolios, collections, services] = await Promise.all([
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
      is_active: true,
      blocked: false,
      is_highlight: true,
      per_page: MAX_HIGHLIGHT_SERVICES,
    }),
  ]);

  return { portfolios, collections, services };
};

export type ArtistSections = Awaited<ReturnType<typeof getArtistHighlights>>;

/** What every section view receives: the raw highlight responses and whose profile it is. */
export type ArtistSectionsViewProps = {
  sections: ArtistSections;
  username: string;
};
