"use client";
import type { ActionReturn } from "@repo/common-lib/types/response";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export const useHandleAction = <K, T>({
  action,
  beforeAction,
  afterAction,
  settings,
}: {
  action:
    | ((formData: FormData) => Promise<ActionReturn<T, K> | null>)
    | (() => Promise<ActionReturn<T, K>>);
  beforeAction?:
    | ((
        formData: FormData,
        prevResult?: ActionReturn<T, K> | null,
      ) => Promise<void>)
    | ((prevResult?: ActionReturn<T, K> | null) => Promise<void>)
    | (() => Promise<void>);
  afterAction?: (result: ActionReturn<T, K>) => Promise<void>;
  settings?: {
    rateLimit?: number;
  };
}) => {
  const [result, setResult] = useState<ActionReturn<T, K> | null>(null);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [inputErrors, setInputErrors] = useState<Record<string, string>>();
  const [isPending, setPending] = useState(false);

  const prevRequest = useRef<Date | null>(null);
  // `null` means no request is queued. A wrapper object (even with an
  // `undefined` formData) means a no-arg/form request is queued for retry.
  const nextRequest = useRef<{ formData?: FormData } | null>(null);
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mirror mutable values into refs so the returned callbacks can stay
  // referentially stable (empty/stable dependency lists) while still reading
  // the latest props/state at call time. This is what prevents consumers that
  // place these callbacks in effect dependency arrays from looping forever.
  const isPendingRef = useRef(false);
  const resultRef = useRef<ActionReturn<T, K> | null>(result);
  const actionRef = useRef(action);
  const beforeActionRef = useRef(beforeAction);
  const afterActionRef = useRef(afterAction);
  const settingsRef = useRef(settings);

  actionRef.current = action;
  beforeActionRef.current = beforeAction;
  afterActionRef.current = afterAction;
  settingsRef.current = settings;
  resultRef.current = result;

  const updatePending = useCallback((value: boolean) => {
    isPendingRef.current = value;
    setPending(value);
  }, []);

  const getRemainingCooldownMs = useCallback(() => {
    const ttlMs = (settingsRef.current?.rateLimit ?? 0) * 1000;
    const prevRequestTime = prevRequest.current?.getTime() ?? 0;
    if (!ttlMs || !prevRequestTime) return 0;
    const elapsedMs = Date.now() - prevRequestTime;
    return Math.max(0, ttlMs - elapsedMs);
  }, []);

  // Holds the latest executeAction so scheduleRetry can call it without
  // creating a circular dependency between the two callbacks.
  const executeActionRef =
    useRef<(formData?: FormData, isRetry?: boolean) => Promise<void>>(null);

  const scheduleRetry = useCallback(() => {
    if (nextRequest.current === null) return;
    if (retryTimeout.current) clearTimeout(retryTimeout.current);

    const _formData = nextRequest.current.formData;
    nextRequest.current = null;
    const delay = getRemainingCooldownMs();

    retryTimeout.current = setTimeout(() => {
      retryTimeout.current = null;
      void executeActionRef.current?.(_formData, true);
    }, delay);
  }, [getRemainingCooldownMs]);

  const executeAction = useCallback(
    async (formData?: FormData, isRetry = false) => {
      if (isPendingRef.current && !isRetry) return;

      const cooldown = getRemainingCooldownMs();
      if (cooldown > 0) {
        nextRequest.current = { formData };
        if (!isPendingRef.current) scheduleRetry();
        return;
      }

      updatePending(true);
      try {
        const beforeAction = beforeActionRef.current;
        if (beforeAction) {
          if (beforeAction.length >= 1 && formData !== undefined) {
            await (
              beforeAction as (
                formData: FormData,
                prevResult?: ActionReturn<T, K> | null,
              ) => Promise<void>
            )(formData, resultRef.current);
          } else if (beforeAction.length >= 1) {
            await (
              beforeAction as (
                prevResult?: ActionReturn<T, K> | null,
              ) => Promise<void>
            )(resultRef.current);
          } else {
            await (beforeAction as () => Promise<void>)();
          }
        }

        const action = actionRef.current;
        const actionResult =
          formData !== undefined
            ? await (
                action as (formData: FormData) => Promise<ActionReturn<T, K>>
              )(formData)
            : await (action as () => Promise<ActionReturn<T, K>>)();

        const afterAction = afterActionRef.current;
        if (afterAction) await afterAction(actionResult);
        setErrors(actionResult.errors);
        setInputErrors(actionResult.inputErrors);
        setResult(actionResult);
        resultRef.current = actionResult;

        prevRequest.current = new Date();
        scheduleRetry();
      } finally {
        updatePending(false);
      }
    },
    [getRemainingCooldownMs, scheduleRetry, updatePending],
  );

  executeActionRef.current = executeAction;

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement> | FormData) => {
      if (!(e instanceof FormData)) {
        e.preventDefault();
      }
      const formData =
        e instanceof FormData ? e : new FormData(e.currentTarget);
      await executeAction(formData);
    },
    [executeAction],
  );

  const handleAction = useCallback(async () => {
    await executeAction();
  }, [executeAction]);

  const cleanErrors = useCallback(() => {
    setErrors(null);
    setInputErrors(undefined);
  }, []);

  const deleteInputErrorProperty = useCallback((key: string) => {
    //avoid rerenders
    setInputErrors((prev) => {
      if (!prev || !prev[key]) return prev;
      const { [key]: _, ...rest } = prev;
      return Object.keys(rest).length > 0 ? rest : undefined;
    });
  }, []);

  const cleanResult = useCallback(() => {
    setResult(null);
    resultRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cleanErrors();
    cleanResult();
  }, [cleanErrors, cleanResult]);

  useEffect(() => {
    if (!result) return;
    const timeout = setTimeout(() => {
      updatePending(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [result, updatePending]);

  return {
    result,
    isPending,
    handleSubmit,
    handleAction,
    errors,
    inputErrors,
    cleanErrors,
    cleanResult,
    deleteInputErrorProperty,
    setErrors,
    reset,
    success: !!result?.data,
  };
};

export type HandlerActionType<T, K> = ReturnType<typeof useHandleAction<T, K>>;
