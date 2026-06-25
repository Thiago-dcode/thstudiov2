import type { ApiResponse } from "@repo/common-lib/types/response";
import { FetchApi } from "@repo/frontend-lib/fetch/fetch-api";
import { useRef, useState } from "react";
import { clientEnv } from "@/env/client";
import type { GeoapifyAutocompleteResponse } from "./types/geoapify";

const LOG_PREFIX = "[useLocationAutocomplete]";

const maskApiKey = (key: string) =>
  key.length <= 8 ? "***" : `${key.slice(0, 4)}...${key.slice(-4)}`;

const logGeoapifyEnv = () => {
  const url = clientEnv.NEXT_PUBLIC_GEOAPIFY_URL;
  const key = clientEnv.NEXT_PUBLIC_GEOAPIFY_KEY;

  console.log(`${LOG_PREFIX} Geoapify env check`, {
    runtime: typeof window === "undefined" ? "server" : "client",
    baseUrl: url || "(empty)",
    baseUrlSet: Boolean(url),
    apiKeySet: Boolean(key),
    apiKeyLength: key?.length ?? 0,
    apiKeyPreview: key ? maskApiKey(key) : "(missing)",
    processEnv: {
      NEXT_PUBLIC_GEOAPIFY_URL:
        process.env.NEXT_PUBLIC_GEOAPIFY_URL ?? "(undefined)",
      NEXT_PUBLIC_GEOAPIFY_KEY: process.env.NEXT_PUBLIC_GEOAPIFY_KEY
        ? `(set, len=${process.env.NEXT_PUBLIC_GEOAPIFY_KEY.length})`
        : "(undefined)",
      GEOAPIFY_URL: process.env.GEOAPIFY_URL ?? "(undefined)",
      GEOAPIFY_KEY: process.env.GEOAPIFY_KEY
        ? `(set, len=${process.env.GEOAPIFY_KEY.length})`
        : "(undefined)",
    },
  });
};

logGeoapifyEnv();

const fetcher = new FetchApi(clientEnv.NEXT_PUBLIC_GEOAPIFY_URL);
fetcher.credentials = "omit";

export const useLocationAutocomplete = () => {
  const cachedResult = useRef<
    Record<string, GeoapifyAutocompleteResponse["features"]>
  >({});
  const [result, setResult] = useState<
    GeoapifyAutocompleteResponse["features"]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>();

  const controller = useRef(new AbortController());
  const search = async (input: string) => {
    if (loading) return;
    try {
      setLoading(true);
      if (cachedResult.current[input]) {
        console.log(`${LOG_PREFIX} cache hit`, { input });
        setResult(cachedResult.current[input]);
        return;
      }

      const apiKey = encodeURIComponent(clientEnv.NEXT_PUBLIC_GEOAPIFY_KEY);
      const resource = `autocomplete?text=${encodeURIComponent(
        input,
      )}&limit=5&apiKey=${apiKey}`;

      console.log(`${LOG_PREFIX} search start`, {
        input,
        baseUrl: clientEnv.NEXT_PUBLIC_GEOAPIFY_URL,
        resource: resource.replace(
          clientEnv.NEXT_PUBLIC_GEOAPIFY_KEY,
          maskApiKey(clientEnv.NEXT_PUBLIC_GEOAPIFY_KEY),
        ),
      });

      const response = await fetcher.get<
        ApiResponse<GeoapifyAutocompleteResponse>
      >({
        resource,
        signal: controller.current.signal,
      });

      if ("error" in response && response.error) {
        console.error(`${LOG_PREFIX} API error response`, {
          input,
          error: response.error,
        });
        setError(response.error);
        setResult([]);
        return;
      }

      if (response.data) {
        const features = response.data.features ?? [];
        console.log(`${LOG_PREFIX} search success`, {
          input,
          featureCount: features.length,
        });
        cachedResult.current[input] = features;
        setResult(features);
        return;
      }

      console.warn(`${LOG_PREFIX} empty response`, { input, response });
      setResult([]);
    } catch (error) {
      console.error(`${LOG_PREFIX} search failed`, { input, error });
      setError(error);
      setResult([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    search,
    result,
    loading,
    error,
  };
};
