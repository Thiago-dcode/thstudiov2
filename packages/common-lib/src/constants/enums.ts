export const ENUMS = {
    BILLING_TYPES: ['MONTHLY', 'TRIMESTAL', 'YEARLY', 'LIFETIME'] as const,
    USER_EDITORS_ROLES: ['ADMIN', 'EDITOR'] as const,
    LANGUAGE_CODE: ['EN', 'ES', 'PT'] as const,
    MEDIA_TYPE: ['IMAGE', 'VIDEO'] as const,
    MEDIA_EXTENSION: ['JPG', 'JPEG', 'PNG', 'GIF', 'MP4', 'MOV'] as const,
    MEDIA_SHAPE: ['SQUARE', 'LANDSCAPE', 'PORTRAIT'] as const,
    PROJECT_STATUS: [
      'NOT_STARTED',
      'PENDING',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'PENDING_PAYMENT',
      'PAUSED',
    ] as const,
    TRANSACTION_STATUS: ['PENDING', 'SUCCESS', 'FAILED'] as const,
    PAYMENT_STATUS: ['PENDING', 'SUCCESS', 'FAILED'] as const,
    PAYMENT_METHOD: ['CARD', 'PAYPAL', 'BANK_TRANSFER'] as const,
    PLAN_OFFERS_TYPES: ['FREE', 'DISCOUNT'] as const,
  };

  export type AvailableEnums = keyof typeof ENUMS;
  export type EnumType<T extends AvailableEnums> = (typeof ENUMS)[T][number];
