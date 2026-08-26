// ==================== WEBSOCKET NAMESPACES ====================
export const WS_NOTIFICATIONS_NAMESPACE = 'notifications' as const;

// ==================== WEBSOCKET EVENTS ====================
export const WS_NOTIFICATION_EVENT = 'notification' as const;

// ==================== WEBSOCKET ROOMS ====================
export const userNotificationRoom = (userId: number) =>
  `user_notification-${userId}` as const;
