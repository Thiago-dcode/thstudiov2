import type Stripe from 'stripe';
import type { LogCorrelation } from '@repo/backend-lib/services/log-service';

type Metadata = Record<string, string>;

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

/** An expandable Stripe field is an id string or the expanded object. */
const idOf = (value: unknown): string | undefined =>
  str(value) ?? str((value as { id?: unknown } | null | undefined)?.id);

const metadataOf = (value: unknown): Metadata | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Metadata) : null;

const positiveInt = (value: unknown): number | undefined => {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return undefined;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : undefined;
};

/**
 * The ids an event is about, for log correlation, plus the metadata we wrote on the object (where
 * `requestId`/`requestAt` live). Pure: no I/O, never the object itself.
 */
export function stripeEventRefs(event: Stripe.Event): { correlation: LogCorrelation; metadata: Metadata | null } {
  const correlation: LogCorrelation = {
    stripe_event_id: str(event.id),
    stripe_event_type: str(event.type),
    stripe_request_id: str(event.request?.id ?? undefined),
  };
  const object = (event.data?.object ?? {}) as unknown as Record<string, unknown>;
  let metadata: Metadata | null = null;
  let userIdRaw: unknown;

  switch (object.object) {
    case 'checkout.session': {
      correlation.stripe_checkout_session_id = str(object.id);
      correlation.stripe_customer_id = idOf(object.customer);
      correlation.stripe_subscription_id = idOf(object.subscription);
      metadata = metadataOf(object.metadata);
      userIdRaw = object.client_reference_id ?? metadata?.user_id;
      break;
    }
    case 'subscription': {
      correlation.stripe_subscription_id = str(object.id);
      correlation.stripe_customer_id = idOf(object.customer);
      metadata = metadataOf(object.metadata);
      break;
    }
    case 'invoice': {
      correlation.stripe_invoice_id = str(object.id);
      correlation.stripe_customer_id = idOf(object.customer);
      // Current API: parent.subscription_details; older ones: subscription_details / subscription.
      const parent = object.parent as { subscription_details?: { subscription?: unknown; metadata?: unknown } } | null | undefined;
      const legacy = object.subscription_details as { metadata?: unknown } | null | undefined;
      correlation.stripe_subscription_id =
        idOf(parent?.subscription_details?.subscription) ?? idOf(object.subscription);
      metadata = metadataOf(parent?.subscription_details?.metadata) ?? metadataOf(legacy?.metadata);
      break;
    }
    case 'payment_intent':
    case 'payment_method': {
      correlation.stripe_customer_id = idOf(object.customer);
      break;
    }
    default:
      break;
  }

  const userId = positiveInt(userIdRaw ?? metadata?.user_id);
  if (userId !== undefined) correlation.user_id = userId;
  return { correlation, metadata };
}
