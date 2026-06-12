"use client";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { type FormEvent, useEffect, useRef, useState } from "react";

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
  const prevRequest = useRef<Date>(null);
  const nextRequest = useRef<FormData | undefined>(null);
  const retryTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const getRemainingCooldownMs = () => {
    const ttlMs = (settings?.rateLimit ?? 0) * 1000;
    const prevRequestTime = prevRequest.current?.getTime() ?? 0;
    if (!ttlMs || !prevRequestTime) return 0;
    const elapsedMs = Date.now() - prevRequestTime;
    return Math.max(0, ttlMs - elapsedMs);
  };
  const scheduleRetry = () => {
    if (nextRequest.current === null) return;
    if (retryTimeout.current) clearTimeout(retryTimeout.current);

    const _formData = nextRequest.current;
    nextRequest.current = null;
    const delay = getRemainingCooldownMs();

    retryTimeout.current = setTimeout(() => {
      retryTimeout.current = null;
      executeAction(_formData, true);
    }, delay);
  };

  const executeAction = async (formData?: FormData, isRetry = false) => {
    if (isPending && !isRetry) return;

    const cooldown = getRemainingCooldownMs();
    if (cooldown > 0) {
      nextRequest.current = formData;
      if (!isPending) scheduleRetry();
      return;
    }

    setPending(true);
    try {
      if (beforeAction) {
        if (beforeAction.length >= 1 && formData !== undefined) {
          await (
            beforeAction as (
              formData: FormData,
              prevResult?: ActionReturn<T, K> | null,
            ) => Promise<void>
          )(formData, result);
        } else if (beforeAction.length >= 1) {
          await (
            beforeAction as (
              prevResult?: ActionReturn<T, K> | null,
            ) => Promise<void>
          )(result);
        } else {
          await (beforeAction as () => Promise<void>)();
        }
      }

      const actionResult =
        formData !== undefined
          ? await (
              action as (formData: FormData) => Promise<ActionReturn<T, K>>
            )(formData)
          : await (action as () => Promise<ActionReturn<T, K>>)();
      if (afterAction) await afterAction(actionResult);
      setErrors(actionResult.errors);
      setInputErrors(actionResult.inputErrors);
      setResult(actionResult);

      prevRequest.current = new Date();
      scheduleRetry();
    } finally {
      setPending(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement> | FormData) => {
    if (!(e instanceof FormData)) {
      e.preventDefault();
    }
    const formData = e instanceof FormData ? e : new FormData(e.currentTarget);
    await executeAction(formData);
  };

  const handleAction = async () => {
    await executeAction();
  };

  const cleanErrors = () => {
    setErrors(null);
    setInputErrors(undefined);
  };
  const deleteInputErrorProperty = (key: string) => {
    //avoid rerenders
    if (!inputErrors || !inputErrors[key]) return;
    setInputErrors((prev) => {
      if (!prev || !prev[key]) return prev;
      const { [key]: _, ...rest } = prev;
      return Object.keys(rest).length > 0 ? rest : undefined;
    });
  };
  const cleanResult = () => {
    setResult(null);
  };
  const reset = () => {
    cleanErrors();
    cleanResult();
  };

  useEffect(() => {
    if (!result) return;
    setTimeout(() => {
      setPending(false);
    }, 300);
  }, [result]);

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
