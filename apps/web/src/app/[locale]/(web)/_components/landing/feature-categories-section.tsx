import type { CategoryBase } from "@repo/common-lib/types/category";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { cn } from "@repo/ui/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import categoriesService from "@/modules/categories/categories.service";
import { WebSection } from "./web-section";

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

function FeaturedCategoryCard({
  category,
  ariaBrowse,
  browse,
}: {
  category: CategoryBase;
  ariaBrowse: string;
  browse: string;
}) {
  const href = categoryBrowseHref(category.slug);
  const label = category.name.trim() || category.slug;

  return (
    <Link
      href={href}
      aria-label={`${ariaBrowse} ${label}`}
      className={cn(
        "group flex h-full min-h-0 flex-col overflow-hidden bg-fg p-2 shadow-md ring-1 ring-border/40 transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-lg hover:ring-border/60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
      )}
    >
      <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden bg-fg-1/60">
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
            className="flex size-full items-center justify-center font-serif text-4xl italic tracking-tight text-text-muted/45 tablet:text-5xl"
            aria-hidden
          >
            {categoryInitial(label)}
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-1.5 pb-1 pt-3">
        <div className="min-w-0 space-y-1">
          <h4 className="truncate font-sans text-base font-medium leading-snug text-text tablet:text-lg">
            {label}
          </h4>
        </div>

        <div className="mt-auto flex items-center justify-end border-t border-border/50 pt-2.5">
          <span className="shrink-0 bg-fg-2 px-3 py-1.5 text-center text-xs font-semibold text-text transition-colors group-hover:bg-fg-1 tablet:px-3.5 tablet:text-sm">
            {browse}
          </span>
        </div>
      </div>
    </Link>
  );
}

export async function FeatureCategoriesSection() {
  const t = await getTranslations("landing.featureCategories");
  const categoriesResponse = await categoriesService.getAll({
    is_featured: true,
    with_thumbnail: true,
  });

  const categories = categoriesResponse.data || [];
  if (!categories.length) return null;

  return (
    <WebSection>
      <WebSection.Container>
        <WebSection.Header
          badge={t("header.badge")}
          title={t("header.title")}
          description={t("header.description")}
          descriptionClassName="max-w-md"
        />

        <div className="grid grid-cols-1 gap-4 phone:grid-cols-2 tablet:grid-cols-3 laptop:grid-cols-4">
          {categories.map((category) => (
            <FeaturedCategoryCard
              key={category.id}
              category={category}
              ariaBrowse={t("card.ariaBrowseArtistsIn")}
              browse={t("card.browse")}
            />
          ))}
        </div>
      </WebSection.Container>
    </WebSection>
  );
}
