jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({ stripe: {} }));

import { runWithLogContext } from '@repo/backend-lib/services/log-service';
import { STRIPE_TRACE_MAX_AGE_SECONDS, StripeService } from './stripe.service';

const NOW = 1_800_000_000;

describe('StripeService trace helpers', () => {
  beforeEach(() => jest.spyOn(Date, 'now').mockReturnValue(NOW * 1000));
  afterEach(() => jest.restoreAllMocks());

  it('AC-17: traceMetadata in context R has user_id, requestId and requestAt', () => {
    runWithLogContext({ id: 'R' }, () => {
      expect(StripeService.traceMetadata(9)).toEqual({ user_id: '9', requestId: 'R', requestAt: String(NOW) });
    });
  });

  it('AC-17: traceMetadata outside a context is just user_id', () => {
    expect(StripeService.traceMetadata(9)).toEqual({ user_id: '9' });
  });

  it('AC-17: a context with a null id gives no requestId', () => {
    runWithLogContext({ id: null }, () => {
      expect(StripeService.traceMetadata(9)).toEqual({ user_id: '9' });
    });
  });

  it('AC-17: the window is 172800 s (two days)', () => {
    expect(STRIPE_TRACE_MAX_AGE_SECONDS).toBe(172800);
  });

  it.each([
    ['same time', NOW, true],
    ['event at the window edge after', NOW + 172800, true],
    ['event at the window edge before', NOW - 172800, true],
    ['event just past the window', NOW + 172801, false],
    ['a renewal months later', NOW + 60 * 86400, false],
  ])('AC-17: traceIdFromMetadata with %s', (_n, eventCreated, fresh) => {
    const metadata = { requestId: 'R', requestAt: String(NOW) };
    expect(StripeService.traceIdFromMetadata(metadata, eventCreated)).toBe(fresh ? 'R' : null);
  });

  it.each([
    ['requestAt missing (subscriptions written before this change)', { requestId: 'R' }],
    ['requestAt non-numeric', { requestId: 'R', requestAt: 'yesterday' }],
    ['requestId missing', { requestAt: String(NOW) }],
    ['empty requestId', { requestId: '', requestAt: String(NOW) }],
    ['null metadata', null],
    ['undefined metadata', undefined],
  ])('AC-17: traceIdFromMetadata returns null for %s', (_n, metadata) => {
    expect(StripeService.traceIdFromMetadata(metadata as any, NOW)).toBeNull();
  });

  it('AC-17: errorSummary never carries raw, headers or request objects', () => {
    const parsed: any = {
      type: 'StripeCardError',
      code: 'card_declined',
      declineCode: 'insufficient_funds',
      statusCode: 402,
      param: 'card',
      isRetryable: false,
      message: 'Declined',
      raw: { headers: { authorization: 'Bearer sk_SECRET' } },
      headers: { 'stripe-version': 'x' },
      requestId: 'req_1',
    };
    const summary = StripeService.errorSummary(parsed, new Error('raw'));
    expect(summary).toEqual({
      type: 'StripeCardError',
      code: 'card_declined',
      decline_code: 'insufficient_funds',
      status_code: 402,
      param: 'card',
      retryable: false,
      message: 'Declined',
    });
    expect(JSON.stringify(summary)).not.toMatch(/SECRET|headers|raw/);
  });

  it('AC-17: errorSummary for a non-Stripe error', () => {
    expect(StripeService.errorSummary(null, new TypeError('bad'))).toMatchObject({ type: 'TypeError', message: 'bad', code: null, status_code: null });
    expect(StripeService.errorSummary(null, 'string')).toMatchObject({ type: 'string', message: 'Unknown error' });
  });
});
