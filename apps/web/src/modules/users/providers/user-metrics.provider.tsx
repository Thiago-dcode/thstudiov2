"use client"

import { useHandleAction } from "@/modules/auth/hooks/useHandleAction"
import { getUserMetricsAction } from "@/modules/users/server-actions/get-user-metrics.action"
import { UserMetrics } from "@repo/common-lib/types/user"
import { useContext, createContext, ReactNode, useState, useEffect, useRef } from "react"

// Context type
type UserMetricsContextType = {
    metrics: UserMetrics | null,
    isLoading: boolean,
    isPending: boolean,
    errors?: string[] | null,
    cleanErrors: () => void,
    refresh: () => Promise<void>,
    success: boolean
}

const UserMetricsContext = createContext<UserMetricsContextType | null>(null)

// Hook to use user metrics context
export const useUserMetrics = () => {
    const context = useContext(UserMetricsContext)
    if (!context) {
        throw new Error('useUserMetrics must be used within a UserMetricsProvider')
    }
    return context
}

// Provider component
export const UserMetricsProvider = ({
    children,
    userId,
    defaultMetrics
}: {
    children: ReactNode,
    userId: number,
    defaultMetrics?: UserMetrics | null
}) => {
    const [metrics, setMetrics] = useState<UserMetrics | null>(defaultMetrics || null);
    const hasLoadedRef = useRef(false);
    
    const { handleAction, isPending, errors, cleanErrors, success, cleanResult, result } = useHandleAction({
        action: async () => {
            return await getUserMetricsAction(userId)
        },
        afterAction: async (result) => {
            if (result.data) {
                setMetrics(result.data)
            }
        },
        beforeAction: async () => {
            cleanErrors()
            cleanResult()
        }
    })

    const refresh = async () => {
        await handleAction()
    }

    // Initial load if no default metrics provided
    useEffect(() => {
        if (!defaultMetrics && userId && !hasLoadedRef.current) {
            hasLoadedRef.current = true;
            handleAction()
        }
    }, [userId, defaultMetrics, handleAction])

    // Update metrics when result changes
    useEffect(() => {
        if (result?.data) {
            setMetrics(result.data)
        }
    }, [result])

    const isLoading = !metrics && isPending

    return (
        <UserMetricsContext.Provider value={{ 
            metrics, 
            isLoading, 
            isPending, 
            errors, 
            cleanErrors, 
            refresh, 
            success 
        }}>
            {children}
        </UserMetricsContext.Provider>
    )
}

export default UserMetricsProvider

