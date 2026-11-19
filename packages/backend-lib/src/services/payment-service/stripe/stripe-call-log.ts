import type Stripe from 'stripe';
import { logService } from '../../../config/logging';

const stripeLog = logService.lib({ channel: 'stripe', name: 'api-call' });

/**
 * One line per Stripe API call: outcome, duration and Stripe's `req_…` id, which is also the
 * `event.request.id` of any webhook the call causes. No headers, idempotency key or query string:
 * only the method, path, status and timing reach the line.
 */
export function logStripeResponse(event: Stripe.ResponseEvent): void {
    try {
        const status = event.status;
        const extraInfo = {
            method: event.method,
            path: typeof event.path === 'string' ? event.path.split('?')[0] : null,
            status,
            duration_ms: event.elapsed,
            api_version: event.api_version,
            stripe_request_id: event.request_id,
        };
        if (status >= 500) stripeLog.error('Stripe API call', extraInfo);
        else if (status >= 400) stripeLog.warn('Stripe API call', extraInfo);
        else stripeLog.info('Stripe API call', extraInfo);
    } catch (error) {
        // Never throw into the SDK's event emitter; never log through LogService from here.
        console.error('Stripe call logging failed', error);
    }
}

/** Subscribes the call log to a client. Network errors emit no `response` event; callers log those. */
export function attachStripeCallLogging(client: { on: (event: 'response', handler: (event: Stripe.ResponseEvent) => void) => unknown }): void {
    try {
        client.on('response', logStripeResponse);
    } catch (error) {
        console.error('Stripe call logging could not be attached', error);
    }
}
