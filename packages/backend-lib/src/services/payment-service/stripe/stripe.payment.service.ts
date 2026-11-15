import Stripe from 'stripe';
import { config } from '@repo/common-lib/config';
import { StripePaymentConfig } from './types';
import { attachStripeCallLogging } from './stripe-call-log';

class StripePaymentService {
    public readonly stripe: Stripe.Stripe;
    public readonly webhookSecret: string;

    constructor(private readonly stripeConfig: StripePaymentConfig) {
        this.stripe = new Stripe(this.stripeConfig.secretKey);
        // One `stripe` line per API call (outcome, duration, req_ id).
        attachStripeCallLogging(this.stripe);
        this.webhookSecret = this.stripeConfig.webhookSecret;
    }
}

const stripeService = new StripePaymentService(config().stripe);
export const stripe: Stripe.Stripe = stripeService.stripe;
export const stripeWebhookSecret = stripeService.webhookSecret;