"use client";

import type { EnumType } from "@repo/common-lib/constants/enums";
import { ENUMS } from "@repo/common-lib/constants/enums";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { cn } from "@repo/ui/lib/utils";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

const SHAPE_OPTIONS = ENUMS.MEDIA_SHAPE;
type ShapeFilter = EnumType<"MEDIA_SHAPE"> | undefined;

/**
 * VIDEO is deliberately absent: the enum carries it, but nothing in the upload flow can produce
 * one yet, so offering the filter would only ever return an empty grid.
 */
const MEDIA_TYPE_OPTIONS = ENUMS.MEDIA_TYPE.filter(
  (type): type is Exclude<EnumType<"MEDIA_TYPE">, "VIDEO"> => type !== "VIDEO",
);
type MediaTypeFilter = EnumType<"MEDIA_TYPE"> | undefined;

function parseShapeParam(value: string | null): ShapeFilter {
  if (!value) return undefined;
  return SHAPE_OPTIONS.includes(value as EnumType<"MEDIA_SHAPE">)
    ? (value as EnumType<"MEDIA_SHAPE">)
    : undefined;
}

function parseMediaTypeParam(value: string | null): MediaTypeFilter {
  if (!value) return undefined;
  return MEDIA_TYPE_OPTIONS.includes(
    value as Exclude<EnumType<"MEDIA_TYPE">, "VIDEO">,
  )
    ? (value as EnumType<"MEDIA_TYPE">)
    : undefined;
}

function buildMediaQueryParams(
  searchParams: URLSearchParams,
  overrides: {
    search?: string;
    shape?: ShapeFilter;
    media_type?: MediaTypeFilter;
  } = {},
) {
  const params: Record<string, string> = {};

  const search =
    overrides.search !== undefined
      ? overrides.search.trim()
      : (searchParams.get("search") ?? "").trim();
  if (search) params.search = search;

  // `in` rather than a truthiness check: clearing a filter passes `undefined` deliberately, and
  // falling through to the current URL would make "All" a no-op.
  const shape =
    "shape" in overrides
      ? overrides.shape
      : parseShapeParam(searchParams.get("shape"));
  if (shape) params.shape = shape;

  const mediaType =
    "media_type" in overrides
      ? overrides.media_type
      : parseMediaTypeParam(searchParams.get("media_type"));
  if (mediaType) params.media_type = mediaType;

  const perPage = searchParams.get("per_page");
  if (perPage) params.per_page = perPage;

  return params;
}

const filterButtonClass = "h-7 px-2.5 text-[11px] font-medium";

export function MediaSearch() {
  const t = useTranslations("atelier.media.search");
  const router = useRouter();
  const searchParams = useSearchParams();
  const tMedia = useTranslations("atelier.media");
  const currentSearch = searchParams.get("search") ?? "";
  const currentShape = parseShapeParam(searchParams.get("shape"));
  const currentMediaType = parseMediaTypeParam(searchParams.get("media_type"));
  const [value, setValue] = useState(currentSearch);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setValue(searchParams.get("search") ?? "");
  }, [searchParams]);

  const navigate = (
    overrides: {
      search?: string;
      shape?: ShapeFilter;
      media_type?: MediaTypeFilter;
    } = {},
  ) => {
    const params = buildMediaQueryParams(searchParams, overrides);

    startTransition(() => {
      router.push(queryParamBuilder("/atelier/media", params));
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ search: value });
  };

  const handleClearSearch = () => {
    setValue("");
    navigate({ search: "" });
  };

  const handleShapeFilter = (shape: ShapeFilter) => {
    navigate({ shape });
  };

  const handleMediaTypeFilter = (media_type: MediaTypeFilter) => {
    navigate({ media_type });
  };

  return (
    <div className="flex flex-col items-start gap-2 w-full max-w-96">
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search className="absolute left-2.5  top-1/2 -translate-y-1/2 size-3.5 text-text-muted pointer-events-none z-30" />
        <Input
          type="text"
          placeholder={t("placeholder")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pl-8  h-9 text-xs!"
          disabled={isPending}
        />
        {value && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
          >
            <X className="size-3.5" />
          </button>
        )}
      </form>

      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-text-muted shrink-0 w-12">
          {t("shapeGroupLabel")}
        </span>
        <Button
          type="button"
          variant={!currentShape ? "secondary" : "ghost"}
          onClick={() => handleShapeFilter(undefined)}
          disabled={isPending}
          className={cn(filterButtonClass, currentShape && "hover:bg-fg-2")}
        >
          {t("all")}
        </Button>
        {SHAPE_OPTIONS.map((shape) => (
          <Button
            key={shape}
            type="button"
            variant={currentShape === shape ? "secondary" : "ghost"}
            onClick={() => handleShapeFilter(shape)}
            disabled={isPending}
            className={cn(
              filterButtonClass,
              "capitalize",
              currentShape !== shape && "hover:bg-fg-2",
            )}
          >
            {shape.toLowerCase()}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-text-muted shrink-0 w-12">
          {t("typeGroupLabel")}
        </span>
        <Button
          type="button"
          variant={!currentMediaType ? "secondary" : "ghost"}
          onClick={() => handleMediaTypeFilter(undefined)}
          disabled={isPending}
          className={cn(filterButtonClass, currentMediaType && "hover:bg-fg-2")}
        >
          {t("all")}
        </Button>
        {MEDIA_TYPE_OPTIONS.map((mediaType) => (
          <Button
            key={mediaType}
            type="button"
            variant={currentMediaType === mediaType ? "secondary" : "ghost"}
            onClick={() => handleMediaTypeFilter(mediaType)}
            disabled={isPending}
            className={cn(
              filterButtonClass,
              currentMediaType !== mediaType && "hover:bg-fg-2",
            )}
          >
            {tMedia(`mediaType.${mediaType}`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
