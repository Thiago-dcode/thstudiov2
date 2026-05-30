"use client";

import { cn } from "@repo/ui/lib/utils";
import { CheckCircle2, Loader2, LocateFixed, MapPinOff } from "lucide-react";
import { useEffect } from "react";
import {
  NEAR_ME_RADIUS_KM,
  NEAR_ME_SESSION_KEY,
  useNearMe,
} from "./use-near-me";

type SearchNearMeButtonProps = {
  clearPreviousFilters?: boolean;
};

export function SearchNearMeButton({
  clearPreviousFilters = false,
}: SearchNearMeButtonProps) {
  const { geoState, hasLocationFilter, isLocated, requestLocation } = useNearMe(
    {
      clearPreviousFilters,
    },
  );

  // Auto-request once per session. The sessionStorage flag prevents re-triggering
  // if the user explicitly removes the "My location" filter badge and this button remounts.
  useEffect(() => {
    if (hasLocationFilter) return;
    if (isLocated) return;
    if (!sessionStorage.getItem(NEAR_ME_SESSION_KEY)) {
      sessionStorage.setItem(NEAR_ME_SESSION_KEY, "1");
      requestLocation();
    }
  }, [hasLocationFilter, isLocated, requestLocation]);

  if (hasLocationFilter) return null;

  const isLocating = geoState === "locating";

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={requestLocation}
        disabled={isLocating}
        aria-live="polite"
        className={cn(
          "group flex items-center gap-2 rounded-full border border-border bg-transparent px-4 py-2 text-sm text-text-muted transition-all",
          "hover:border-text/30 hover:text-text",
          "cursor-pointer disabled:cursor-wait disabled:opacity-60",
          isLocated &&
            "border-accent/40 text-accent hover:border-accent/60 hover:text-accent",
        )}
      >
        {isLocating ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
        ) : isLocated ? (
          <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
        ) : (
          <LocateFixed
            className="size-3.5 shrink-0 transition-transform group-hover:scale-110"
            aria-hidden
          />
        )}
        <span className="text-xs font-medium tracking-wide">
          {isLocating
            ? "Getting location…"
            : isLocated
              ? `Near me · ${NEAR_ME_RADIUS_KM} km`
              : "Search close to me"}
        </span>
      </button>

      {geoState === "denied" && (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-xs text-text-muted"
        >
          <MapPinOff className="size-3.5 shrink-0" aria-hidden />
          Enable location in browser settings and try again.
        </p>
      )}

      {geoState === "unavailable" && (
        <p role="alert" className="text-xs text-text-muted">
          Couldn&apos;t get your location. Please try again.
        </p>
      )}
    </div>
  );
}
