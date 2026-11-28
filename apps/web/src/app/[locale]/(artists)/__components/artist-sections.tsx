import { getArtistHighlights } from "./artist-sections.data";
import { ArtistSectionsEmpty } from "./artist-sections-empty";
import { ArtistSectionsListView } from "./artist-sections-list.view";
import { ArtistSectionsTabsView } from "./artist-sections-tabs.view";

type ArtistSectionsProps = {
  username: string;
  displayName: string;
  /** `list` stacks the sections (accordion on small phones); `tab` shows one at a time. */
  sectionStyle?: "tab" | "list";
};

/** Fetches the artist's highlights and renders them with the view picked by `sectionStyle`. */
export const ArtistSections = async ({
  username,
  displayName,
  sectionStyle = "list",
}: ArtistSectionsProps) => {
  const sections = await getArtistHighlights(username);

  const isEmpty = Object.values(sections).every((res) => !res.data?.length);
  if (isEmpty) return <ArtistSectionsEmpty displayName={displayName} />;

  return (
    <div className="mx-auto w-full max-w-(--breakpoint-desktop-lg) px-4 phone-lg:px-6 tablet:px-10 laptop:px-12">
      {sectionStyle === "tab" ? (
        <>
          {/* Phones keep the list's accordion; the tabs take over from 640px up. */}
          <ArtistSectionsListView
            sections={sections}
            username={username}
            mobileOnly
          />
          <div className="hidden phone-lg:block">
            <ArtistSectionsTabsView sections={sections} username={username} />
          </div>
        </>
      ) : (
        <ArtistSectionsListView sections={sections} username={username} />
      )}
    </div>
  );
};
