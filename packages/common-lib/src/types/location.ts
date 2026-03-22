import {
  CitySchema,
  CountrySchema,
  StateSchema,
} from "../schemas/location";

// ==================== LOCATION ENTITY TYPES ====================

export type Country = CountrySchema;
export type State = StateSchema;
export type City = CitySchema;

// ==================== QUEUE / PROCESSOR PAYLOAD ====================

export type CreateOrUpdateLocationPayload = {
  country: string;
  country_code: string;
  state?: string;
  city?: string;
};

// ==================== LIST / FILTER REQUESTS ====================

export type CountryIndexRequest = {
  text?: string;
};

export type StateIndexRequest = {
  country_id?: number;
};

export type CityIndexRequest = {
  country_id?: number;
  state_id?: number;
};

// ==================== INTERNAL FIELDS ====================

type InternalCountryFields = "id" | "created_at" | "updated_at";
type InternalStateFields = "id" | "created_at" | "updated_at";
type InternalCityFields = "id" | "created_at" | "updated_at";

// ==================== COUNTRY INPUT ====================

export type CreateCountryInput = Omit<CountrySchema, InternalCountryFields>;
export type UpdateCountryInput = Partial<
  Omit<CountrySchema, InternalCountryFields>
>;

// ==================== STATE INPUT ====================

export type CreateStateInput = Omit<StateSchema, InternalStateFields>;
export type UpdateStateInput = Partial<Omit<StateSchema, InternalStateFields>>;

// ==================== CITY INPUT ====================

export type CreateCityInput = Omit<CitySchema, InternalCityFields>;
export type UpdateCityInput = Partial<Omit<CitySchema, InternalCityFields>>;
