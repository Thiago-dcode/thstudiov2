"use client";

import type { Media } from "@repo/common-lib/types/media";
import type {
  DeleteMediaNotificationPayload,
  NewContactNotificationPayload,
} from "@repo/common-lib/types/user-notification";
import { useEffect, useRef } from "react";
import { useUserNotifications } from "../contexts/user-notifications.provider";

type NotificationHandler<T> = (payload: T) => Promise<void> | void;

type SubscribeToUserNotificationCallbacks = {
  newContactCallback?: NotificationHandler<NewContactNotificationPayload>;
  createUpdateMediaCallback?: NotificationHandler<Media>;
  generateMetadataMediaCallback?: NotificationHandler<Media>;
  failedGenerateMediaMetadataCallback?: NotificationHandler<Media>;
  onDeleteMediaCallback?: NotificationHandler<DeleteMediaNotificationPayload>;
};

export const useSubscribeToUserNotification = ({
  callbackId,
  newContactCallback,
  createUpdateMediaCallback,
  generateMetadataMediaCallback,
  failedGenerateMediaMetadataCallback,
  onDeleteMediaCallback,
}: {
  callbackId: string;
} & SubscribeToUserNotificationCallbacks) => {
  const { subscribeToUserNotification, unsubscribeToUserNotification } =
    useUserNotifications();
  const callbacksRef = useRef<SubscribeToUserNotificationCallbacks>({
    newContactCallback,
    createUpdateMediaCallback,
    generateMetadataMediaCallback,
    failedGenerateMediaMetadataCallback,
    onDeleteMediaCallback,
  });
  callbacksRef.current = {
    newContactCallback,
    createUpdateMediaCallback,
    generateMetadataMediaCallback,
    failedGenerateMediaMetadataCallback,
    onDeleteMediaCallback,
  };

  useEffect(() => {
    subscribeToUserNotification(callbackId, (notification) => {
      const callbacks = callbacksRef.current;

      switch (notification.type) {
        case "NEW_CONTACT": {
          if (!notification.payload) return;
          return callbacks.newContactCallback?.(notification.payload);
        }
        case "CREATE_UPDATE_MEDIA": {
          if (!notification.payload) return;
          return callbacks.createUpdateMediaCallback?.(notification.payload);
        }
        case "GENERATE_MEDIA_METADATA": {
          if (!notification.payload) return;
          return callbacks.generateMetadataMediaCallback?.(
            notification.payload,
          );
        }
        case "FAILED_GENERATE_MEDIA_METADATA": {
          if (!notification.payload) return;
          return callbacks.failedGenerateMediaMetadataCallback?.(
            notification.payload,
          );
        }
        case "DELETE_MEDIA": {
          return callbacks.onDeleteMediaCallback?.(notification.payload);
        }
      }
    });
    return () => {
      unsubscribeToUserNotification(callbackId);
    };
  }, [callbackId, subscribeToUserNotification, unsubscribeToUserNotification]);
};
