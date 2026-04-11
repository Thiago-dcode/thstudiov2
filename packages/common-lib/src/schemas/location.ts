import { TABLES_ENUM } from "../constants/enums";
import { TableColumn } from "../types/database";

// ==================== COUNTRY SCHEMA ====================
export type CountrySchema = {
  id: number;
  country_code: string;
  name: string;
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
  state_id: number;
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
