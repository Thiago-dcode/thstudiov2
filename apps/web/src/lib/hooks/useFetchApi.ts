import type {
  ApiResponse,
  ErrorResponse,
  SuccessResponse,
} from "@repo/common-lib/types/response";
import { useCallback, useEffect, useRef, useState } from "react";

export const useFetchApi = <T, K>(
  handler: (request?: K) => Promise<ApiResponse<T>>,
  options?: {
    params?: K;
    callImmediately?: boolean;
    beforeFetchCallback?: (request?: K) => Promise<boolean>;
    afterFetchCallback?: (result: ApiResponse<T>) => Promise<void>;
  },
) => {
  const [data, setData] = useState<SuccessResponse<T> | null>(null);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const beforeFetchCallback = options?.beforeFetchCallback;
  const afterFetchCallback = options?.afterFetchCallback;
  const callImmediately = options?.callImmediately;
  const params = options?.params;

  const handleFetch = useCallback(
    async (request?: K) => {
      if (isLoadingRef.current) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      isLoadingRef.current = true;
      setIsLoading(true);

      try {
        if (
          beforeFetchCallback &&
          (await beforeFetchCallback(request))
        ) {
          return;
        }
        const result = await handler(request);
        if (afterFetchCallback) await afterFetchCallback(result);
        if (result.data && !result.error) {
          setData(result);
        } else if (result.error) {
          setError(result);
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          return;
        }
        // Handle other errors
        console.error("Fetch error:", err);
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [handler, afterFetchCallback, beforeFetchCallback],
  );

  const reset = () => {
    setData(null);
    setError(null);
  };
  useEffect(() => {
    if (callImmediately) {
      handleFetch(params);
    }

    // ✅ Cleanup: abort on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [callImmediately, handleFetch, params]);

  return {
    data,
    error,
    isLoading,
    handleFetch,
    reset,
  };
};
