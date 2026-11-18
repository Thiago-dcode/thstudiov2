const constructEvent = jest.fn();

jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: { webhooks: { constructEvent } },
  stripeWebhookSecret: 'whsec_SECRETWEBHOOK',
}));

import { BadRequestException } from '@nestjs/common';
import { FactoryLogService, LogService, configureLogProcess, runWithLogContext } from '@repo/backend-lib/services/log-service';
import { ConsoleLogService } from '@repo/backend-lib/services/log-service';
import { WebhooksController } from './webhooks.controller';

const CREATED = 1_800_000_000;
const SIGNATURE = 't=1,v1=SECRETSIGNATURE';
const RAW = Buffer.from('{"raw":"SECRETRAWBODY"}');

const eventOf = (metadata: Record<string, string> | undefined): any => ({
  id: 'evt_1',
  type: 'customer.subscription.updated',
  created: CREATED,
  livemode: false,
  api_version: '2025-01-01',
  request: { id: 'req_stripe' },
  data: { object: { object: 'subscription', id: 'sub_1', customer: 'cus_1', metadata } },
});

const setup = () => {
  const lines: any[] = [];
  const capture = (spy: jest.SpyInstance) => spy.mockImplementation((line: unknown) => {
    try { lines.push(JSON.parse(String(line))); } catch { /* not a log line */ }
  });
  capture(jest.spyOn(console, 'log'));
  capture(jest.spyOn(console, 'warn'));
  capture(jest.spyOn(console, 'error'));
  jest.spyOn(FactoryLogService, 'createLogService').mockImplementation((_t, cfg) => new ConsoleLogService(cfg));
  jest.spyOn(LogService, 'flush').mockResolvedValue(undefined);
  const queue = { getJob: jest.fn().mockResolvedValue(null), add: jest.fn().mockResolvedValue({ id: 'stripe-evt_1' }), name: 'stripe-webhooks' };
  const controller = new WebhooksController(queue as any);
  const call = (signature: string | undefined, rawBody: Buffer | undefined, body?: unknown) =>
    runWithLogContext({ id: 'HTTP-1' }, () => controller.stripe(signature as string, { rawBody, body }));
  return { controller, queue, lines, call };
};

const wh = (lines: any[], message: string) => lines.filter((l) => l.channel === 'webhooks' && l.message === message);

describe('WebhooksController logging', () => {
  beforeEach(() => {
    constructEvent.mockReset();
    configureLogProcess({ service: 'api' });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    configureLogProcess({ service: '', onCritical: null });
  });

  it('AC-23: no signature gives warn "Stripe webhook rejected" {missing_signature} and 400', async () => {
    const { call, lines, queue } = setup();
    await expect(call(undefined, RAW)).rejects.toBeInstanceOf(BadRequestException);
    const [line] = wh(lines, 'Stripe webhook rejected');
    expect(line.level).toBe('WARN');
    expect(line.extraInfo).toEqual({ reason: 'missing_signature' });
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('AC-23: a parsed body without raw bytes gives exactly one critical "Stripe webhook raw body unavailable" and 400', async () => {
    const { call, lines } = setup();
    await expect(call(SIGNATURE, undefined, { id: 'evt_1', type: 'x' })).rejects.toBeInstanceOf(BadRequestException);
    const criticals = lines.filter((l) => l.level === 'CRITICAL');
    expect(criticals).toHaveLength(1);
    expect(criticals[0].message).toBe('Stripe webhook raw body unavailable');
    expect(criticals[0].channel).toBe('webhooks');
  });

  it.each([
    ['an empty body', undefined],
    ['an empty parsed object', {}],
    ['a text/plain body (parsed as an empty object or string)', 'hello'],
    ['null', null],
  ])('Round 1: %s without raw bytes warns {missing_body}, never critical', async (_n, body) => {
    const { call, lines, queue } = setup();
    await expect(call(SIGNATURE, undefined, body)).rejects.toBeInstanceOf(BadRequestException);
    expect(lines.filter((l) => l.level === 'CRITICAL')).toHaveLength(0);
    const [line] = wh(lines, 'Stripe webhook rejected');
    expect(line.level).toBe('WARN');
    expect(line.extraInfo).toEqual({ reason: 'missing_body' });
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('AC-23: a bad signature gives critical {invalid_signature} and 400, with no signature or secret in any line', async () => {
    const { call, lines } = setup();
    constructEvent.mockImplementation(() => { throw new Error('No signatures found matching the expected signature'); });
    await expect(call(SIGNATURE, RAW)).rejects.toBeInstanceOf(BadRequestException);
    const [line] = wh(lines, 'Stripe webhook rejected');
    expect(line.level).toBe('CRITICAL');
    expect(line.extraInfo.reason).toBe('invalid_signature');
    const dumped = JSON.stringify(lines);
    expect(dumped).not.toMatch(/SECRETSIGNATURE|SECRETWEBHOOK|SECRETRAWBODY|whsec_/);
  });

  it('AC-23: a job already queued gives "duplicate ignored" and add is not called', async () => {
    const { call, lines, queue } = setup();
    constructEvent.mockReturnValue(eventOf(undefined));
    queue.getJob.mockResolvedValue({ id: 'stripe-evt_1' });
    await expect(call(SIGNATURE, RAW)).resolves.toEqual({ received: true });
    expect(queue.getJob).toHaveBeenCalledWith('stripe-evt_1');
    expect(queue.add).not.toHaveBeenCalled();
    const [line] = wh(lines, 'Stripe webhook duplicate ignored');
    expect(line.level).toBe('INFO');
    expect(line.extraInfo).toEqual({ reason: 'already_queued', job_id: 'stripe-evt_1' });
  });

  it('AC-23: accepted with fresh metadata: the line takes the originating id and keeps the HTTP id in extraInfo', async () => {
    const { call, lines, queue } = setup();
    constructEvent.mockReturnValue(eventOf({ requestId: 'R', requestAt: String(CREATED - 60), user_id: '9' }));
    await expect(call(SIGNATURE, RAW)).resolves.toEqual({ received: true });
    const [line] = wh(lines, 'Stripe webhook accepted');
    expect(line.id).toBe('R');
    expect(line.correlation).toMatchObject({
      user_id: 9,
      stripe_event_id: 'evt_1',
      stripe_event_type: 'customer.subscription.updated',
      stripe_request_id: 'req_stripe',
      stripe_customer_id: 'cus_1',
      stripe_subscription_id: 'sub_1',
    });
    expect(line.extraInfo).toMatchObject({ job_id: 'stripe-evt_1', webhook_request_id: 'HTTP-1', livemode: false });
    const [name, data, opts] = queue.add.mock.calls[0];
    expect(name).toBe('stripe-webhook');
    expect(data.id).toBe('evt_1');
    expect(opts.jobId).toBe('stripe-evt_1');
    expect(opts.attempts).toBe(5);
    expect(JSON.parse(opts.telemetry.metadata).id).toBe('R');
  });

  it('AC-23: stale metadata keeps the HTTP request id', async () => {
    const { call, lines, queue } = setup();
    constructEvent.mockReturnValue(eventOf({ requestId: 'R', requestAt: String(CREATED - 10 * 86400) }));
    await call(SIGNATURE, RAW);
    expect(wh(lines, 'Stripe webhook accepted')[0].id).toBe('HTTP-1');
    expect(JSON.parse(queue.add.mock.calls[0][2].telemetry.metadata).id).toBe('HTTP-1');
  });

  it('AC-23: metadata without requestAt (today\'s subscriptions) keeps the HTTP request id', async () => {
    const { call, lines } = setup();
    constructEvent.mockReturnValue(eventOf({ requestId: 'R' }));
    await call(SIGNATURE, RAW);
    expect(wh(lines, 'Stripe webhook accepted')[0].id).toBe('HTTP-1');
  });

  it('AC-23: no line contains the signature, the webhook secret, the raw body or the Stripe object', async () => {
    const { call, lines } = setup();
    constructEvent.mockReturnValue(eventOf({ requestId: 'R', requestAt: String(CREATED) }));
    await call(SIGNATURE, RAW);
    const dumped = JSON.stringify(lines);
    expect(dumped).not.toMatch(/SECRETSIGNATURE|SECRETWEBHOOK|SECRETRAWBODY|"object":"subscription"/);
  });

  it('AC-23: the controller no longer writes a "received" line', async () => {
    const { call, lines } = setup();
    constructEvent.mockReturnValue(eventOf(undefined));
    await call(SIGNATURE, RAW);
    expect(lines.some((l) => /received/i.test(l.message) && l.channel === 'webhooks')).toBe(false);
  });
});
