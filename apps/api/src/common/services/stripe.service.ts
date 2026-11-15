import { Injectable } from '@nestjs/common';
import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import { ENUMS } from '@repo/common-lib/constants/enums';
import { StripeError } from '@repo/common-lib/types/stripe';
import { getLogContext } from '@repo/backend-lib/services/log-service';

/**
 * How long a `requestId` written into Stripe metadata may relabel the webhooks it causes.
 * Checkout sessions live 24 h; the rest is margin. Older (or undated) ids belong to the request
 * that created the object months ago, not to the renewal now firing.
 */
export const STRIPE_TRACE_MAX_AGE_SECONDS = 172800;
@Injectable()
export class StripeService {
  /**
   * Metadata for every Stripe object we create or change: the subject user, plus the trace id and
   * when it was written, so the webhook it causes can rejoin the originating request.
   * `requestId` keeps its historical key name.
   */
  public static traceMetadata(userId: number): Record<string, string> {
    const metadata: Record<string, string> = { user_id: String(userId) };
    const requestId = getLogContext()?.id;
    if (requestId) {
      metadata.requestId = requestId;
      metadata.requestAt = String(Math.floor(Date.now() / 1000));
    }
    return metadata;
  }

  /** The trace id in `metadata`, only when it was written close to `eventCreatedSec`. */
  public static traceIdFromMetadata(
    metadata: Record<string, string> | null | undefined,
    eventCreatedSec: number,
  ): string | null {
    const requestId = metadata?.requestId;
    const requestAt = Number(metadata?.requestAt);
    if (typeof requestId !== 'string' || !requestId || !metadata?.requestAt || !Number.isFinite(requestAt)) {
      return null;
    }
    return Math.abs(eventCreatedSec - requestAt) <= STRIPE_TRACE_MAX_AGE_SECONDS ? requestId : null;
  }

  /** A loggable summary of a Stripe failure: never `raw`, headers or request objects. */
  public static errorSummary(parsed: StripeError | null, raw: unknown) {
    if (parsed) {
      return {
        type: parsed.type,
        code: parsed.code,
        decline_code: parsed.declineCode,
        status_code: parsed.statusCode,
        param: parsed.param,
        retryable: parsed.isRetryable,
        message: parsed.message,
      };
    }
    return {
      type: raw instanceof Error ? raw.name : typeof raw,
      code: null,
      decline_code: null,
      status_code: null,
      param: null,
      retryable: null,
      message: raw instanceof Error ? raw.message : 'Unknown error',
    };
  }

  public static async getUserPaymentMethod(stripeCustomerId: string) {
    if (!stripeCustomerId) {
      return [];
    }
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
    });
    return paymentMethods.data;
  }

  public static parseError(error: any): StripeError | null {
    // Not a Stripe error

    if (
      !error ||
      !ENUMS.STRIPE_ERROR.some((err) => err === error?.type) ||
      !error?.raw ||
      !ENUMS.STRIPE_RAW_ERROR_TYPE.some((err) => err === error?.raw?.type)
    ) {
      return null;
    }

    return {
      type: error.type,
      rawType: error.raw.type,
      code: error.raw.code || null,
      message: error.message || 'An error occurred with the payment provider',
      param: error.raw.param || null,
      statusCode: error.statusCode,
      declineCode: error.raw.decline_code || null,
      isRetryable: this.isRetryableError(error.statusCode, error.raw.type),
    };
  }

  private static isRetryableError(statusCode: number, type: string): boolean {
    // Server errors (5xx) are typically retryable
    if (statusCode >= 500 && statusCode < 600) {
      return true;
    }
    // Rate limiting - should retry with exponential backoff
    if (statusCode === 429) {
      return true;
    }
    // External dependency failures may be retryable
    if (statusCode === 424) {
      return true;
    }
    // API errors that aren't client-side issues may be retryable
    if (type === 'api_error') {
      return true;
    }
    return false;
  }
}
