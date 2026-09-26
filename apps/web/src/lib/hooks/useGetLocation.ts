import type { ApiResponse } from "@repo/common-lib/types/response";
import { FetchApi } from "@repo/frontend-lib/fetch/fetch-api";
import { useRef, useState } from "react";
import { clientEnv } from "@/env/client";
import type { GeoapifyAutocompleteResponse } from "./types/geoapify";

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
        setResult(cachedResult.current[input]);
        return;
      }

      const apiKey = encodeURIComponent(clientEnv.NEXT_PUBLIC_GEOAPIFY_KEY);
      // `lang=en`: the picked names become the country / state / city rows (and the slugs place
      // pages resolve), so every artist must get the same spelling — "Lisbon", never also "Lisboa".
      const resource = `autocomplete?text=${encodeURIComponent(
        input,
      )}&limit=5&lang=en&apiKey=${apiKey}`;
      const response = await fetcher.get<
        ApiResponse<GeoapifyAutocompleteResponse>
      >({
        resource,
        signal: controller.current.signal,
      });

      if ("error" in response && response.error) {
        setError(response.error);
        setResult([]);
        return;
      }

      if (response.data) {
        const features = response.data.features ?? [];
        cachedResult.current[input] = features;
        setResult(features);
        return;
      }

      setResult([]);
    } catch (error) {
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
