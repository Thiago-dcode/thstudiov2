import { useRef, useState } from "react"
import { fetchGeo } from "../facade/fetchApi";
import { config } from "../config";
import { GeoapifyAutocompleteResponse } from "./types/geoapify";
import { ApiResponse, SuccessResponse } from "@repo/common-lib/types/response";

const fetcher = fetchGeo();
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
                )}&limit=5&apiKey=${config.geoapi_key}`,
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