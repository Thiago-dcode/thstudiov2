import type { LocationInput } from "@repo/common-lib/types/location";
import type { GeoapifyFeature } from "@/lib/hooks/types/geoapify";

/** Stable combobox key for a geocoder result. */
export const geoapifyFeatureKey = (feature: GeoapifyFeature) =>
  feature.properties.place_id ||
  `${feature.properties.lat}-${feature.properties.lon}-${feature.properties.formatted}`;

/**
 * A picked geocoder result as the API's `location` payload. `null` when the feature lacks what
 * the API needs to place it (an id to dedupe on, a country to hang it from).
 */
export const featureToLocationInput = (
  feature: GeoapifyFeature,
): LocationInput | null => {
  const p = feature.properties;
  if (!p.place_id || !p.country || !p.country_code || !p.formatted) return null;
  return {
    place_id: p.place_id,
    formatted: p.formatted,
    name: p.name || p.city || p.state || p.address_line1 || p.country,
    result_type: p.result_type || null,
    latitude: p.lat ?? null,
    longitude: p.lon ?? null,
    country: p.country,
    country_code: p.country_code,
    state: p.state ?? null,
    city: p.city ?? null,
  };
};
