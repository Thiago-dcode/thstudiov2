import categoriesService from "@/modules/categories/categories.service";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import type { CategoryBase } from "@repo/common-lib/types/category";
import { cn } from "@repo/ui/lib/utils";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function categoryBrowseHref(slug: string): string {
    return queryParamBuilder(
        "/artists",
        { categories: [slug] },
        { arrayStyle: "commas" },
    );
}

function categoryInitial(name: string): string {
    const t = name.trim();
    if (!t) return "?";
    return t.slice(0, 1).toUpperCase();
}

function FeaturedCategoryCard({ category }: { category: CategoryBase }) {
    const href = categoryBrowseHref(category.slug);
    const label = category.name.trim() || category.slug;

    return (
        <Link
            href={href}
            aria-label={`Browse artists in ${label}`}
            className={cn(
                "group flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-fg p-2 shadow-md ring-1 ring-border/40 transition-all duration-300",
                "hover:-translate-y-0.5 hover:shadow-lg hover:ring-border/60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
            )}
        >
            <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-2xl bg-fg-1/60">
                {category.thumbnail ? (
                    <Image
                        src={category.thumbnail}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                        sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 26vw, (min-width: 768px) 32vw, 90vw"
                    />
                ) : (
                    <span
                        className="flex size-full items-center justify-center font-serif text-3xl italic tracking-tight text-text-muted/45 tablet:text-4xl"
                        aria-hidden
                    >
                        {categoryInitial(label)}
                    </span>
                )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 px-1.5 pb-1 pt-3">
                <div className="min-w-0 space-y-1">
                    <h3 className="truncate font-sans text-sm font-semibold leading-tight text-text tablet:text-base">
                        {label}
                    </h3>
                </div>

                <div className="mt-auto flex items-center justify-end border-t border-border/50 pt-2.5">
                    <span className="shrink-0 rounded-full bg-fg-2 px-3 py-1.5 text-center text-xs font-semibold text-text transition-colors group-hover:bg-fg-1 tablet:px-3.5 tablet:text-sm">
                        Browse
                    </span>
                </div>
            </div>
        </Link>
    );
}

export async function FeatureCategoriesSection() {
    const categoriesResponse = await categoriesService.getAll({
        is_featured: true,
        with_thumbnail: true,
    });

    const categories = categoriesResponse.data || [];
    if (!categories.length) return null;

    return (
        <section className="border-t border-border/40">
            <div className="mx-auto w-full max-w-(--screen-desktop) px-6 py-20 tablet:px-10 tablet:py-28">
                <header className="mb-12 flex flex-col items-center gap-3 text-center">
                    <h2 className="font-serif text-3xl font-medium italic tracking-tight tablet:text-4xl">
                        Featured Categories
                    </h2>
                    <p className="max-w-md text-sm leading-relaxed text-text-muted tablet:text-base">
                        Discover artists by discipline — each path leads to curated results.
                    </p>
                </header>

                <div className="grid grid-cols-1 gap-4 phone:grid-cols-2 tablet:grid-cols-3 laptop:grid-cols-4">
                    {categories.map((category) => (
                        <FeaturedCategoryCard key={category.id} category={category} />
                    ))}
                </div>
            </div>
        </section>
    );
}
