import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { cn } from "@repo/ui/lib/utils";
import { SECTION_GRID_CLASS } from "./artist-sections.constants";

const SectionHeaderSkeleton = () => (
  <div className="mb-6 flex items-center justify-between phone-lg:mb-8 tablet:mb-10">
    <div className="flex items-center gap-3 phone-lg:gap-4">
      <span className="h-px w-5 bg-border/60 phone-lg:w-8" />
      <Skeleton className="h-3 w-24" />
      <span className="h-px w-5 bg-border/60 phone-lg:w-8" />
    </div>
    <Skeleton className="h-3 w-12" />
  </div>
);

const SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6"];

const CardGridSkeleton = ({
  count,
  ratio,
}: {
  count: number;
  ratio: string;
}) => (
  <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3 tablet-lg:gap-5">
    {SKELETON_KEYS.slice(0, count).map((key) => (
      <Skeleton key={key} className={`w-full ${ratio}`} />
    ))}
  </div>
);

const TAB_KEYS = ["t1", "t2", "t3"];
const TAB_CARD_KEYS = ["c1", "c2", "c3", "c4", "c5"];

/** Mirrors `ArtistSectionsTabsView` (640px up): a hairline tab bar, then the first tab's grid. */
const TabsSkeleton = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "mx-auto w-full max-w-(--breakpoint-desktop-lg) px-4 phone-lg:px-6 tablet:px-10 laptop:px-12",
      className,
    )}
    aria-hidden="true"
  >
    <div className="mb-10 flex gap-8 border-b border-border tablet:mb-14 tablet:gap-12">
      {TAB_KEYS.map((key, index) => (
        <div key={key} className="relative flex min-h-11 items-center py-4">
          <Skeleton className="h-3 w-20" />
          {index === 0 && (
            <span className="absolute inset-x-0 -bottom-px h-px bg-border-em" />
          )}
        </div>
      ))}
    </div>
    <div className={SECTION_GRID_CLASS}>
      {TAB_CARD_KEYS.map((key, index) => (
        <Skeleton
          key={key}
          // Match the grid's visible columns: 2 below tablet, 3 tablet, 4 tablet-lg, 5 laptop.
          className={cn(
            "aspect-[1240/1667] w-full",
            index >= 2 && "hidden tablet:block",
            index >= 3 && "tablet:hidden tablet-lg:block",
            index >= 4 && "tablet-lg:hidden laptop:block",
          )}
        />
      ))}
    </div>
  </div>
);

export const ArtistSectionsSkeleton = ({
  sectionStyle = "list",
}: {
  sectionStyle?: "tab" | "list";
}) =>
  sectionStyle === "tab" ? (
    // Same split as the tab layout: the list's sections on phones, tabs from 640px up.
    <>
      <ListSkeleton className="phone-lg:hidden" />
      <TabsSkeleton className="hidden phone-lg:block" />
    </>
  ) : (
    <ListSkeleton />
  );

const ListSkeleton = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "mx-auto w-full max-w-(--breakpoint-desktop-lg) space-y-20 px-4 phone-lg:px-6 tablet:space-y-28 tablet:px-10 laptop:px-12",
      className,
    )}
    aria-hidden="true"
  >
    <section>
      <SectionHeaderSkeleton />
      <CardGridSkeleton count={3} ratio="aspect-square" />
    </section>
    <section>
      <SectionHeaderSkeleton />
      <CardGridSkeleton count={4} ratio="aspect-square" />
    </section>
  </div>
);
