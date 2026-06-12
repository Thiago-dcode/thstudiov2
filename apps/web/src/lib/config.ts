import { serverEnv } from "@/env/server";

export const config = {
  encryption_secret: serverEnv.ENCRYPTION_SECRET,
  app_url: serverEnv.APP_URL,
  api_v1_url: serverEnv.API_V1_URL,
  geoapi_url: serverEnv.GEOAPIFY_URL,
  geoapi_key: serverEnv.GEOAPIFY_KEY,
  app_name: "a11studio",
};
