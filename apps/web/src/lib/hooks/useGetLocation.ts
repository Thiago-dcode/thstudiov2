import { useRef, useState } from "react"
import { FetchApi } from "@repo/frontend-lib/fetch/fetch-api";
import { clientEnv } from "@/env/client";
import { GeoapifyAutocompleteResponse } from "./types/geoapify";
import { ApiResponse } from "@repo/common-lib/types/response";

const fetcher = new FetchApi(clientEnv.NEXT_PUBLIC_GEOAPIFY_URL);
fetcher.credentials = 'omit';

export const useLocationAutocomplete = () => {

    const [result, setResult] = useState<GeoapifyAutocompleteResponse['features']>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>()

    const controller = useRef(new AbortController());
    const search = async (input: string) => {
        if (loading) return;
        try {
            setLoading(true);
            const response = await fetcher.get<ApiResponse<GeoapifyAutocompleteResponse>>({
                resource: `autocomplete?text=${encodeURIComponent(
                    input
                )}&limit=5&apiKey=${clientEnv.NEXT_PUBLIC_GEOAPIFY_KEY}`,
                signal: controller.current.signal
            });

            if(response.data){
                setResult(response.data.features);
            }
            
          
        } catch (error) {
            setError(error);
            setResult([]);
        } finally {
            setLoading(false);
        }

    }

    return {
        search,
        result,
        loading,
        error
    }
}
