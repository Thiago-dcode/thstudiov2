import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import {
  stripe,
  stripeWebhookSecret,
} from '@repo/backend-lib/services/payment-service/stripe';
import {
  FactoryLogService,
  addLogCorrelation,
  getLogContext,
  setLogTraceId,
} from '@repo/backend-lib/services/log-service';
import { enqueueJob } from '@repo/backend-lib/utils';
import type Stripe from 'stripe';
import { StripeService } from 'src/common/services/stripe.service';
import { stripeEventRefs } from './stripe-event-refs';
import { Public } from 'src/common/decorators/public.decorator';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  STRIPE_WEBHOOKS_QUEUE,
  JOB_STRIPE_WEBHOOK,
} from '@repo/common-lib/constants/queues';
import { Throttle } from '@nestjs/throttler';

@Throttle({
  short: { ttl: 1000, limit: 50 },
  medium: { ttl: 10000, limit: 200 },
  long: { ttl: 60000, limit: 500 },
})
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'webhooks',
    name: 'receive-stripe-webhook',
  });

  constructor(
    @InjectQueue(STRIPE_WEBHOOKS_QUEUE) private stripeQueue: Queue,
  ) { }

  @Public()
  @Post('stripe')
  async stripe(
    @Headers('stripe-signature') signature: string,
    @Req() req: { rawBody?: Buffer; body?: unknown },
  ) {
    // No "received" line: api.access already records the request. Never the body or signature.
    if (!signature) {
      this.logger.warn('Stripe webhook rejected', { reason: 'missing_signature' });
      throw new BadRequestException('Missing stripe-signature header');
    }
    if (!req.rawBody) {
      // Nest only keeps raw bytes for bodies its json/urlencoded parser read. A parsed body with no
      // raw bytes means the parser setup lost them, and every real webhook fails until fixed. An
      // empty or text/plain body is just a bad request anyone can send: never alert on that.
      const parsedButRawLost =
        !!req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0;
      if (parsedButRawLost) this.logger.critical('Stripe webhook raw body unavailable');
      else this.logger.warn('Stripe webhook rejected', { reason: 'missing_body' });
      throw new BadRequestException('Raw body not available');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        stripeWebhookSecret,
      );
    } catch (err: unknown) {
      this.logger.warn('Stripe webhook rejected', {
        reason: 'invalid_signature',
        error_message: err instanceof Error ? err.message : 'Unknown error',
      });
      throw new BadRequestException('Webhook signature verification failed');
    }

    // Rejoin the request that caused this event, when the object carries a fresh trace id.
    // api.access / api.error keep the HTTP request id through logBinding().
    const webhookRequestId = getLogContext()?.id ?? null;
    const refs = stripeEventRefs(event);
    addLogCorrelation(refs.correlation);
    const traceId = StripeService.traceIdFromMetadata(refs.metadata, event.created);
    if (traceId) setLogTraceId(traceId);

    const jobId = `stripe-${event.id}`;
    // Stripe retries deliveries; BullMQ would silently drop the duplicate add, so say so.
    if (await this.stripeQueue.getJob(jobId)) {
      this.logger.info('Stripe webhook duplicate ignored', { reason: 'already_queued', job_id: jobId });
      return { received: true };
    }

    this.logger.info('Stripe webhook accepted', {
      job_id: jobId,
      livemode: event.livemode,
      api_version: event.api_version ?? null,
      webhook_request_id: webhookRequestId,
    });

    await enqueueJob(this.stripeQueue, JOB_STRIPE_WEBHOOK, event, {
      jobId,
      priority: 1,
      removeOnComplete: true,
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
    });

    return { received: true };
  }

  // @Post('paypal')
  // async handlePaypalWebhook(@Body() body: unknown) {
  //     // await this.webhooksService.handlePaypalEvent(body);

  //     return { received: true };
  // }
}
