import Stripe from 'stripe';
import { config } from '@repo/common-lib/config';
import { StripePaymentConfig } from './types';

 class StripePaymentService {

    public readonly stripe:Stripe;

constructor(private readonly config:StripePaymentConfig){

    this.stripe = new Stripe(this.config.secretKey);
}

}

export const stripe = new StripePaymentService(config().stripe).stripe;