"use client";

import {
  WS_NOTIFICATION_EVENT,
  WS_NOTIFICATIONS_NAMESPACE,
} from "@repo/common-lib/constants/websocket";
import type { UserNotification } from "@repo/common-lib/types/user-notification";
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
import { useWebsocket } from "@/lib/hooks/useWebsocket";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { getAllUserNotificationsAction } from "../server-actions/user-notifications.action";

type UserNotificationsContextType = {
  notifications: UserNotification[];
  isLoading: boolean;
  unreadCount: number;
  hasPendingToRead: boolean;
  setAddNotificationCallback: (
    callback: (notification: UserNotification) => Promise<void> | void,
  ) => Promise<void> | void;
};

const UserNotificationsContext =
  createContext<UserNotificationsContextType | null>(null);

export const useUserNotifications = () => {
  const context = useContext(UserNotificationsContext);
  if (!context) {
    throw new Error(
      "useUserNotifications must be used within a UserNotificationsProvider",
    );
  }
  return context;
};

export const UserNotificationsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const currentPage = useRef(1);
  const hasLoadedRef = useRef(false);
  const [userNotifications, setUserNotifications] = useState<
    Map<number, UserNotification>
  >(new Map());
  // A ref, not state: subscribing is not something anything renders, and holding the list in
  // state let `addUserNotification` capture an empty array on its first render and keep calling
  // that one forever.
  const addNotificationCallbacks = useRef<
    ((notification: UserNotification) => Promise<void> | void)[]
  >([]);

  const userNotificationsArr = useMemo(
    () =>
      [...userNotifications.values()].sort((a, b) => {
        // unread (no read_at) first, then newest id
        const unreadDiff = Number(!!a.read_at) - Number(!!b.read_at);
        if (unreadDiff !== 0) return unreadDiff;
        return b.id - a.id;
      }),
    [userNotifications],
  );

  const setAddNotificationCallback = useCallback(
    (callback: (notification: UserNotification) => Promise<void> | void) => {
      addNotificationCallbacks.current = [
        ...addNotificationCallbacks.current,
        callback,
      ];
    },
    [],
  );

  const unreadCount = useMemo(
    () => userNotificationsArr.filter((n) => !n.read_at).length,
    [userNotificationsArr],
  );

  const hasPendingToRead = useMemo(
    () => userNotificationsArr.some((n) => !n.read_at),
    [userNotificationsArr],
  );

  const addUserNotification = useCallback(
    async (notification: UserNotification) => {
      setUserNotifications((prev) => {
        const next = new Map(prev);
        next.set(notification.id, notification);
        return next;
      });
      await Promise.all(
        addNotificationCallbacks.current.map(
          async (cb) => await cb(notification),
        ),
      );
    },
    [],
  );

  const { handleAction, isPending } = useHandleAction({
    action: async () => {
      return getAllUserNotificationsAction({
        paginated: true,
        per_page: 10,
        page: currentPage.current,
      });
    },
    afterAction: async (result) => {
      if (!result.data) return;
      setUserNotifications((prev) => {
        const next = new Map(prev);
        for (const userNot of result.data ?? []) {
          next.set(userNot.id, userNot);
        }
        return next;
      });
    },
  });

  const { connect, disconnect } = useWebsocket(WS_NOTIFICATIONS_NAMESPACE, {
    listen: {
      [WS_NOTIFICATION_EVENT]: async (data) => {
        await addUserNotification(data as UserNotification);
      },
    },
  });

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    void handleAction();
  }, [handleAction]);

  const isLoading = userNotifications.size === 0 && isPending;

  // Memoised so consumers only re-render when the notifications themselves change, not on every
  // render of this provider.
  const value = useMemo(
    () => ({
      notifications: userNotificationsArr,
      isLoading,
      unreadCount,
      hasPendingToRead,
      setAddNotificationCallback,
    }),
    [
      userNotificationsArr,
      isLoading,
      unreadCount,
      hasPendingToRead,
      setAddNotificationCallback,
    ],
  );

  return (
    <UserNotificationsContext.Provider value={value}>
      {children}
    </UserNotificationsContext.Provider>
  );
};
