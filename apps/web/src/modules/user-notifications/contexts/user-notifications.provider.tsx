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
  /** Writes a notification the caller already has in hand, e.g. the one an action just read. */
  updateUserNotification: (notification: UserNotification) => void;
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
    UserNotification[]
  >([]);
  // A ref, not state: subscribing is not something anything renders, and holding the list in
  // state let `addUserNotification` capture an empty array on its first render and keep calling
  // that one forever.
  const addNotificationCallbacks = useRef<
    ((notification: UserNotification) => Promise<void> | void)[]
  >([]);

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
    () => userNotifications.filter((n) => !n.read_at).length,
    [userNotifications],
  );

  const hasPendingToRead = useMemo(
    () => userNotifications.some((n) => !n.read_at),
    [userNotifications],
  );

  const updateUserNotification = useCallback(
    (notification: UserNotification) => {
      setUserNotifications((prev) => {
        const existIndex = prev.findIndex((n) => n.id === notification.id);
        if (existIndex === -1) {
          return [notification, ...prev];
        }
        const next = [...prev];
        next[existIndex] = notification;
        return next;
      });
    },
    [],
  );

  // Arriving is more than being written: only a notification that came in over the socket runs
  // the subscriber callbacks.
  const addUserNotification = useCallback(
    async (notification: UserNotification) => {
      updateUserNotification(notification);
      await Promise.all(
        addNotificationCallbacks.current.map(
          async (cb) => await cb(notification),
        ),
      );
    },
    [updateUserNotification],
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
      const incoming = result.data;
      if (!incoming) return;
      setUserNotifications((prev) => {
        const byId = new Map(prev.map((n) => [n.id, n]));
        for (const notification of incoming) {
          byId.set(notification.id, notification);
        }
        return [...byId.values()];
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

  const isLoading = userNotifications.length === 0 && isPending;

  // Memoised so consumers only re-render when the notifications themselves change, not on every
  // render of this provider.
  const value = useMemo(
    () => ({
      notifications: userNotifications,
      isLoading,
      unreadCount,
      hasPendingToRead,
      updateUserNotification,
      setAddNotificationCallback,
    }),
    [
      userNotifications,
      isLoading,
      unreadCount,
      hasPendingToRead,
      updateUserNotification,
      setAddNotificationCallback,
    ],
  );

  return (
    <UserNotificationsContext.Provider value={value}>
      {children}
    </UserNotificationsContext.Provider>
  );
};
