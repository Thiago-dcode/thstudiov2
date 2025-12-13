import { Injectable } from '@nestjs/common';
import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import { ENUMS } from '@repo/common-lib/constants/enums';
import { StripeError } from '@repo/common-lib/types/stripe';
@Injectable()
export class StripeService {
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
