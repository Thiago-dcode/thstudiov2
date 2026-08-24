"use client";

import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import type { UserNotification } from "@repo/common-lib/types/user-notification";
import { createContext, type ReactNode, useContext, useMemo, useRef, useState } from "react";
import { getAllUserNotificationsAction } from "../server-actions/user-notifications.action";

type UserNotificationsContextType = {
  notifications?: UserNotification[];
};

const UserNotificationsContext = createContext<UserNotificationsContextType>({
});

export const useUserNotifications = () => useContext(UserNotificationsContext);

export const UserNotificationsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {

  const currentPage = useRef(1);
  const [userNotifications, setUserNotifications] = useState<Map<number, UserNotification>>(new Map());
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

  const addUserNotification = (notification: UserNotification) => {

    const _map = new Map(userNotifications);
    _map.set(notification.id, notification);
    setUserNotifications(_map);

  }

  const { } = useHandleAction({
    action: async () => {
      return getAllUserNotificationsAction({
        paginated: true,
        per_page: 10,
        page: currentPage.current
      });
    },
    afterAction: async (result) => {

      if (result.data) {
        const _map = new Map<number, UserNotification>(userNotifications)
        result.data.forEach(userNot => {
          _map.set(userNot.id, userNot);
        });
        setUserNotifications(_map);
      }



    }
  })

  return (
    <UserNotificationsContext.Provider
      value={{
        notifications: userNotificationsArr,
      }}
    >
      {children}
    </UserNotificationsContext.Provider>
  );
};
