"use client";

import { useCallback, useState } from "react";
import { useFilters } from "./filters.provider";

export const NEAR_ME_RADIUS_KM = 100;
export const NEAR_ME_SESSION_KEY = "nearMe.autoAsked";

export type GeoState = "idle" | "locating" | "denied" | "unavailable";

type UseNearMeOptions = {
  clearPreviousFilters?: boolean;
};

export function useNearMe({
  clearPreviousFilters = false,
}: UseNearMeOptions = {}) {
  const { addMany, clearAll, filters } = useFilters();
  const [geoState, setGeoState] = useState<GeoState>("idle");

  const hasLocationFilter =
    filters.lat != null || filters.lng != null || filters.radius_km != null;
  const isLocated = filters.lat != null && filters.lng != null;

  const requestLocation = useCallback(() => {
    sessionStorage.setItem(NEAR_ME_SESSION_KEY, "1");

    if (!navigator.geolocation) {
      setGeoState("unavailable");
      return;
    }

    setGeoState("locating");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (clearPreviousFilters) clearAll();
        addMany({
          lat: coords.latitude,
          lng: coords.longitude,
          radius_km: NEAR_ME_RADIUS_KM,
        });
        setGeoState("idle");
      },
      (err) => {
        setGeoState(
          err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }, [addMany, clearAll, clearPreviousFilters]);

  return { geoState, hasLocationFilter, isLocated, requestLocation };
}
