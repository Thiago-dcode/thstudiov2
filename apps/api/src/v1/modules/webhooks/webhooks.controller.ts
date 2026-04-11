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
import { FactoryLogService } from '@repo/backend-lib/services/log-service';
import { Public } from 'src/common/decorators/public.decorator';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  STRIPE_WEBHOOKS_QUEUE,
  JOB_STRIPE_WEBHOOK,
} from '@repo/common-lib/constants/constants';
import { Throttle } from '@nestjs/throttler';

@Throttle({
  short: { ttl: 1000, limit: 50 },
  medium: { ttl: 10000, limit: 200 },
  long: { ttl: 60000, limit: 500 },
})
@Controller('webhooks')
export class WebhooksController {
  private logger = FactoryLogService.createLogService('file', {
    channel: 'webhook',
  });

  constructor(
    @InjectQueue(STRIPE_WEBHOOKS_QUEUE) private stripeQueue: Queue,
  ) { }

  @Public()
  @Post('stripe')
  async stripe(
    @Headers('stripe-signature') signature: string,
    @Req() req: { rawBody?: Buffer },
  ) {
    this.logger = this.logger.name('stripe');
    this.logger.info('Received Stripe webhook');

    if (!signature) {
      this.logger.error('Missing stripe-signature header');
      throw new BadRequestException('Missing stripe-signature header');
    }
    if (!req.rawBody) {
      this.logger.error('Raw body not available');
      throw new BadRequestException('Raw body not available');
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        stripeWebhookSecret,
      );
      this.logger.info(`Webhook signature verified for event type: ${event.type}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Webhook signature verification failed: ${message}`);
      throw new BadRequestException('Webhook signature verification failed');
    }

    await this.stripeQueue.add(
      JOB_STRIPE_WEBHOOK,
      event,
      {
        jobId: `stripe-${event.id}`,
        priority: 1,
        removeOnComplete: true,
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
    this.logger.info(`Added Stripe webhook event to queue: ${event.id}`);

    return { received: true };
  }

  // @Post('paypal')
  // async handlePaypalWebhook(@Body() body: unknown) {
  //     // await this.webhooksService.handlePaypalEvent(body);

  //     return { received: true };
  // }
}
