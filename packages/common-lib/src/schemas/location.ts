import { TABLES_ENUM } from "../constants/enums";
import { TableColumn } from "../types/database";

// ==================== COUNTRY SCHEMA ====================
export type CountrySchema = {
  id: number;
  country_code: string;
  name: string;
  /** URL key, unique across countries — see `toPlaceSlug`. */
  slug: string;
  created_at: Date;
  updated_at: Date;
};

export type CountrySchemaWithoutTimestamps = Omit<
  CountrySchema,
  "created_at" | "updated_at"
>;

const tablesCountry = [TABLES_ENUM.COUNTRIES] as const;
export type CountrySchemaColumns = TableColumn<
  typeof tablesCountry,
  CountrySchema
>;

// ==================== STATE SCHEMA ====================
export type StateSchema = {
  id: number;
  name: string;
  /** URL key, unique within its country. */
  slug: string;
  country_id: number;
  created_at: Date;
  updated_at: Date;
};

export type StateSchemaWithoutTimestamps = Omit<
  StateSchema,
  "created_at" | "updated_at"
>;

const tablesState = [TABLES_ENUM.STATES] as const;
export type StateSchemaColumns = TableColumn<
  typeof tablesState,
  StateSchema
>;

// ==================== CITY SCHEMA ====================
export type CitySchema = {
  id: number;
  name: string;
  /** URL key, unique within its (country, state). */
  slug: string;
  /** Null when the geocoder gave no state (city-states, many smaller countries). */
  state_id: number | null;
  country_id: number;
  created_at: Date;
  updated_at: Date;
};

export type CitySchemaWithoutTimestamps = Omit<
  CitySchema,
  "created_at" | "updated_at"
>;

const tablesCity = [TABLES_ENUM.CITIES] as const;
export type CitySchemaColumns = TableColumn<
  typeof tablesCity,
  CitySchema
>;

// ==================== LOCATION SCHEMA ====================
/**
 * One place an artist picked (a geocoder feature), deduplicated by `place_id` and linked into
 * the country → state → city hierarchy. `media.location_id` points here; place pages filter
 * through the hierarchy ids, so a "Prado Museum" pick still lists under Madrid.
 */
export type LocationSchema = {
  id: number;
  /** The geocoder's stable id for the feature. */
  place_id: string;
  /** Full human label, e.g. "Museo del Prado, Madrid, Spain". */
  formatted: string;
  /** The feature's own name, e.g. "Museo del Prado" or "Madrid". */
  name: string;
  /** Geocoder granularity: city, state, country, amenity, … */
  result_type: string | null;
  latitude: number | null;
  longitude: number | null;
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
  created_at: Date;
  updated_at: Date;
};

const tablesLocation = [TABLES_ENUM.LOCATIONS] as const;
export type LocationSchemaColumns = TableColumn<
  typeof tablesLocation,
  LocationSchema
>;
