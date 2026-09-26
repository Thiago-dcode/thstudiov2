import * as z from "zod";

/**
 * A picked place as the API's `location` payload (`LocationInput`). Every value comes from the
 * geocoder, not from typing, so there are no per-field messages: a malformed pick is a bug, and
 * the API's `LocationInputRequest` enforces the same caps.
 */
export const locationInputSchema = z.object({
  place_id: z.string().min(1).max(255),
  formatted: z.string().min(1).max(512),
  name: z.string().min(1).max(255),
  result_type: z.string().max(32).nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  country: z.string().min(1).max(255),
  country_code: z.string().min(2).max(5),
  state: z.string().max(255).nullable().optional(),
  city: z.string().max(255).nullable().optional(),
});
