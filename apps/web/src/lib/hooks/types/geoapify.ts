export type GeoapifyFeatureProperties = {
  country: string;
  country_code: string;
  state?: string;
  county?: string;
  city?: string;
  iso3166_2?: string;
  iso3166_2_sublevel?: string;
  lon: number;
  lat: number;
  state_code?: string;
  result_type: string;
  county_code?: string;
  NUTS_3?: string;
  formatted: string;
  address_line1: string;
  address_line2: string;
  category: string;
  plus_code?: string;
  plus_code_short?: string;
};

export type GeoapifyFeature = {
  properties: GeoapifyFeatureProperties;
};

export type GeoapifyAutocompleteResponse = {
  type: "FeatureCollection";
  features: GeoapifyFeature[];
  query?: {
    text: string;
    parsed?: {
      city?: string;
      expected_type?: string;
    };
    categories?: unknown[];
  };
};

