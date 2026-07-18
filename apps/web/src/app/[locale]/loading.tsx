import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function GlobalLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16 tablet:px-10 tablet:py-24">
      <div className="space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-3 phone:grid-cols-2 tablet:grid-cols-3 tablet:gap-4 laptop:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2.5">
            <Skeleton className="aspect-4/5 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
