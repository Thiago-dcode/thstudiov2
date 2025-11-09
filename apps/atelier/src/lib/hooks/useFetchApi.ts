import { useCallback, useEffect, useRef, useState } from "react";
import { ApiResponse, ErrorResponse, SuccessResponse } from "@repo/common-lib/types/response";

export const useFetchApi = <T extends any, K extends any>(
  handler: (request?: K, signal?: AbortSignal) => Promise<ApiResponse<T>>,  // ✅ Add signal parameter
  options?: {
    params?: K,
    callInmediately?: boolean,
  }
) => {
  const [data, setData] = useState<SuccessResponse<T> | null>(null);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFetch = useCallback(async (request?: K) => {
  
    if (isLoadingRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      console.log(request)
      const result = await handler(request, signal); 
    
      if (result.data && !result.error) {
     
        setData(result);
      } else if (result.error) {
        setError(result);
      }
    } catch (err: any) {
      // ✅ Handle abort error
      if (err.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      // Handle other errors
      console.error('Fetch error:', err);
    } finally {
        console.log('hi')
        isLoadingRef.current = false;
        setIsLoading(false);
    }
  }, [handler]);

  useEffect(() => {
    if (options?.callInmediately) {
      handleFetch(options.params);
    }

    // ✅ Cleanup: abort on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [options?.callInmediately, handleFetch, options?.params]);

  return {
    data,
    error,
    isLoading,
    handleFetch,
  };
};