import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

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

export const ArtistSectionsSkeleton = () => (
 <div
 className="mx-auto w-full max-w-5xl space-y-20 px-4 phone-lg:px-6 tablet:space-y-28 tablet:px-12"
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
