"use client";

import type { EnumType } from "@repo/common-lib/constants/enums";
import { ENUMS } from "@repo/common-lib/constants/enums";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { cn } from "@repo/ui/lib/utils";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const SHAPE_OPTIONS = ENUMS.MEDIA_SHAPE;
type ShapeFilter = EnumType<"MEDIA_SHAPE"> | undefined;

function parseShapeParam(value: string | null): ShapeFilter {
  if (!value) return undefined;
  return SHAPE_OPTIONS.includes(value as EnumType<"MEDIA_SHAPE">)
    ? (value as EnumType<"MEDIA_SHAPE">)
    : undefined;
}

function buildMediaQueryParams(
  searchParams: URLSearchParams,
  overrides: { search?: string; shape?: ShapeFilter } = {},
) {
  const params: Record<string, string> = {};

  const search =
    overrides.search !== undefined
      ? overrides.search.trim()
      : (searchParams.get("search") ?? "").trim();
  if (search) params.search = search;

  const shape =
    "shape" in overrides
      ? overrides.shape
      : parseShapeParam(searchParams.get("shape"));
  if (shape) params.shape = shape;

  const perPage = searchParams.get("per_page");
  if (perPage) params.per_page = perPage;

  return params;
}

const filterButtonClass = "h-7 px-2.5 text-[11px] font-medium";

export function MediaSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("search") ?? "";
  const currentShape = parseShapeParam(searchParams.get("shape"));
  const [value, setValue] = useState(currentSearch);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setValue(searchParams.get("search") ?? "");
  }, [searchParams]);

  const navigate = (
    overrides: { search?: string; shape?: ShapeFilter } = {},
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

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <form onSubmit={handleSubmit} className="relative w-full max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-muted pointer-events-none" />
        <Input
          type="text"
          placeholder="Search media…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pl-8 pr-8 h-9 text-xs"
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
        <Button
          type="button"
          variant={!currentShape ? "secondary" : "ghost"}
          onClick={() => handleShapeFilter(undefined)}
          disabled={isPending}
          className={cn(filterButtonClass, currentShape && "hover:bg-fg-2")}
        >
          All
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
    </div>
  );
}
