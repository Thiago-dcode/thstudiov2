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
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider";
import { getAllUserNotificationsAction } from "../server-actions/user-notifications.action";

type UserNotificationCallback = (
  notification: UserNotification,
) => Promise<void> | void;

type UserNotificationsContextType = {
  notifications: UserNotification[];
  isLoading: boolean;
  unreadCount: number;
  hasPendingToRead: boolean;
  /** Writes a notification the caller already has in hand, e.g. the one an action just read. */
  updateUserNotification: (notification: UserNotification) => void;
  /** Bulk form of {@link updateUserNotification} — one state write for a whole batch. */
  updateUserNotifications: (notifications: UserNotification[]) => void;
  subscribeToUserNotification: (
    id: string,
    callback: UserNotificationCallback,
  ) => void;
  unsubscribeToUserNotification: (id: string) => void;
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
  const { refresh } = useUserMetrics();
  const currentPage = useRef(1);
  const hasLoadedRef = useRef(false);
  const [userNotifications, setUserNotifications] = useState<
    UserNotification[]
  >([]);
  // A ref, not state: subscribing is not something anything renders, and holding the list in
  // state let `addUserNotification` capture an empty array on its first render and keep calling
  // that one forever.
  const addNotificationCallbacks = useRef<
    Map<string, UserNotificationCallback>
  >(new Map());

  const subscribeToUserNotification = useCallback(
    (id: string, callback: UserNotificationCallback) => {
      addNotificationCallbacks.current.set(id, callback);
    },
    [],
  );

  const unsubscribeToUserNotification = useCallback((id: string) => {
    addNotificationCallbacks.current.delete(id);
  }, []);

  const unreadCount = useMemo(
    () => userNotifications.filter((n) => !n.read_at).length,
    [userNotifications],
  );

  const hasPendingToRead = useMemo(
    () => userNotifications.some((n) => !n.read_at),
    [userNotifications],
  );

  // Known ones are replaced in place so the list does not reshuffle under the user; unknown ones
  // are prepended, newest first.
  const updateUserNotifications = useCallback(
    (notifications: UserNotification[]) => {
      if (!notifications.length) return;
      setUserNotifications((prev) => {
        const next = [...prev];
        const incoming: UserNotification[] = [];
        for (const notification of notifications) {
          const existIndex = next.findIndex((n) => n.id === notification.id);
          if (existIndex === -1) {
            incoming.unshift(notification);
            continue;
          }
          next[existIndex] = notification;
        }
        return incoming.length ? [...incoming, ...next] : next;
      });
    },
    [],
  );

  const updateUserNotification = useCallback(
    (notification: UserNotification) => {
      updateUserNotifications([notification]);
    },
    [updateUserNotifications],
  );

  // Arriving is more than being written: only a notification that came in over the socket runs
  // the subscriber callbacks.
  const addUserNotification = useCallback(
    async (notification: UserNotification) => {
      updateUserNotification(notification);
      // `Array.from`, not `.values().toArray()`: the latter is an ES2025 iterator helper that
      // throws on browsers this app still targets, and a throw here kills every subscriber at once.
      const promises = Array.from(
        addNotificationCallbacks.current.values(),
      ).map(async (cb) => await cb(notification));
      promises.push(refresh());
      // Settled, not all: one subscriber throwing must not cancel the others or the metrics
      // refresh, and must not reject into the socket handler that only `void`s this.
      await Promise.allSettled(promises);
    },
    [updateUserNotification, refresh],
  );

  const { handleAction, isPending } = useHandleAction({
    action: async () => {
      return getAllUserNotificationsAction({
        paginated: true,
        per_page: 15,
        unread: true,
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
    // Fires on every (re)connect, not just the first. Anything emitted while the socket was down
    // is gone otherwise — nothing else refetches, so a media whose completion notification fell
    // into that gap would spin until a reload. The merge above is keyed by id, so replaying
    // notifications already held is a no-op.
    onConnect: () => {
      void handleAction();
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
      updateUserNotifications,
      subscribeToUserNotification,
      unsubscribeToUserNotification,
    }),
    [
      userNotifications,
      isLoading,
      unreadCount,
      hasPendingToRead,
      updateUserNotification,
      updateUserNotifications,
      subscribeToUserNotification,
      unsubscribeToUserNotification,
    ],
  );

  return (
    <UserNotificationsContext.Provider value={value}>
      {children}
    </UserNotificationsContext.Provider>
  );
};
