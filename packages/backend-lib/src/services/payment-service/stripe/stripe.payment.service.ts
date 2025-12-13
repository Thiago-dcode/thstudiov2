import Stripe from 'stripe';
import { config } from '@repo/common-lib/config';
import { StripePaymentConfig } from './types';

class StripePaymentService {
    public readonly stripe: Stripe;
    public readonly webhookSecret: string;

    constructor(private readonly stripeConfig: StripePaymentConfig) {
        this.stripe = new Stripe(this.stripeConfig.secretKey);
        this.webhookSecret = this.stripeConfig.webhookSecret;
    }
}

const stripeService = new StripePaymentService(config().stripe);
export const stripe = stripeService.stripe;
export const stripeWebhookSecret = stripeService.webhookSecret;