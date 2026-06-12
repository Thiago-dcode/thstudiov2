"use client";

import { STRIKES_TO_BAN } from "@repo/common-lib/constants/constants";
import type { UserMetrics } from "@repo/common-lib/types/user";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { getUserMetricsAction } from "@/modules/users/server-actions/get-user-metrics.action";

// Context type
type UserMetricsContextType = {
  metrics: UserMetrics | null;
  isLoading: boolean;
  isPending: boolean;
  errors?: string[] | null;
  cleanErrors: () => void;
  refresh: () => Promise<void>;
  success: boolean;
  aiCreditsInfo: { consumed: number; total: number } | null;
  isUserAccountBanned: boolean;
};

const UserMetricsContext = createContext<UserMetricsContextType | null>(null);

// Hook to use user metrics context
export const useUserMetrics = () => {
  const context = useContext(UserMetricsContext);
  if (!context) {
    throw new Error("useUserMetrics must be used within a UserMetricsProvider");
  }
  return context;
};

// Provider component
export const UserMetricsProvider = ({
  children,
  userId,
  defaultMetrics,
}: {
  children: ReactNode;
  userId: number;
  defaultMetrics?: UserMetrics | null;
}) => {
  const [metrics, setMetrics] = useState<UserMetrics | null>(
    defaultMetrics || null,
  );
  const hasLoadedRef = useRef(false);

  const {
    handleAction,
    isPending,
    errors,
    cleanErrors,
    success,
    cleanResult,
    result,
  } = useHandleAction({
    action: async () => {
      return await getUserMetricsAction(userId);
    },
    afterAction: async (result) => {
      if (result.data) {
        setMetrics(result.data);
      }
    },
    beforeAction: async () => {
      cleanErrors();
      cleanResult();
    },
  });

  const refresh = async () => {
    await handleAction();
  };

  // Initial load if no default metrics provided
  useEffect(() => {
    if (!defaultMetrics && userId && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      handleAction();
    }
  }, [userId, defaultMetrics, handleAction]);

  // Update metrics when result changes
  useEffect(() => {
    if (result?.data) {
      setMetrics(result.data);
    }
  }, [result]);

  const isLoading = !metrics && isPending;

  // Calculate AI credits
  const aiCreditsInfo = useMemo(() => {
    if (!metrics?.extra_data || !metrics?.active_plan) return null;
    const consumed = metrics.extra_data.ai_credits_consumed || 0;
    const total =
      (metrics.extra_data.ai_credits || 0) +
      (metrics.active_plan.ai_credits || 0);
    return { consumed, total };
  }, [metrics]);

  const isUserAccountBanned = useMemo(() => {
    if (!metrics?.extra_data?.ban_lift) return false;
    return (
      metrics.extra_data.account_strikes >= STRIKES_TO_BAN &&
      new Date(metrics.extra_data.ban_lift) > new Date()
    );
  }, [metrics]);

  return (
    <UserMetricsContext.Provider
      value={{
        metrics,
        isLoading,
        isPending,
        errors,
        cleanErrors,
        refresh,
        success,
        aiCreditsInfo,
        isUserAccountBanned,
      }}
    >
      {children}
    </UserMetricsContext.Provider>
  );
};

export default UserMetricsProvider;
