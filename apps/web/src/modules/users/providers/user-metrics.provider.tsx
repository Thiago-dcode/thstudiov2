"use client";

import type { EnumType } from "@repo/common-lib/constants/enums";
import { STRIKES_TO_BAN } from "@repo/common-lib/constants/limits";
import type { UserMetrics } from "@repo/common-lib/types/user";
import { AiCreditsHelper } from "@repo/common-lib/utils/ai-credits";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { getUserMetricsAction } from "@/modules/users/server-actions/get-user-metrics.action";

type AiCreditsInfo = {
  consumed: number;
  total: number;
  remaining: number;
  hasCredits: boolean;
  /** AI credit cost of generating metadata for a given media type (video costs more). */
  costFor: (mediaType: EnumType<"MEDIA_TYPE"> | null | undefined) => number;
  /** Whether `remaining` covers the cost of generating metadata for a given media type. */
  canAfford: (mediaType: EnumType<"MEDIA_TYPE"> | null | undefined) => boolean;
};
// Context type
type UserMetricsContextType = {
  metrics: UserMetrics | null;
  isLoading: boolean;
  isPending: boolean;
  errors?: string[] | null;
  cleanErrors: () => void;
  refresh: () => Promise<void>;
  success: boolean;
  aiCreditsInfo: AiCreditsInfo;
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
    // A batch upload fires one refresh per notification. `executeAction` drops a call outright
    // while one is in flight and only queues a *trailing* retry when a cooldown is configured —
    // without this, the metrics that changed most (storage used, AI credits) settle on an early
    // snapshot instead of the final total.
    settings: { rateLimit: 2 },
  });

  // Stable identity: consumers put this in effect/callback dependency arrays.
  const refresh = useCallback(async () => {
    await handleAction();
  }, [handleAction]);

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
  const aiCreditsInfo: AiCreditsInfo = useMemo(() => {
    const costFor = AiCreditsHelper.metadataCreditCost;
    if (!metrics?.extra_data || !metrics?.active_plan)
      return {
        consumed: 0,
        hasCredits: false,
        total: 0,
        remaining: 0,
        costFor,
        canAfford: () => false,
      };
    const consumed = metrics.extra_data.ai_credits_consumed || 0;
    const total =
      (metrics.extra_data.ai_credits || 0) +
      (metrics.active_plan.ai_credits || 0);
    const remaining = total - consumed;
    return {
      consumed,
      total,
      remaining,
      hasCredits: consumed < total,
      costFor,
      canAfford: (mediaType) => remaining >= costFor(mediaType),
    };
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
