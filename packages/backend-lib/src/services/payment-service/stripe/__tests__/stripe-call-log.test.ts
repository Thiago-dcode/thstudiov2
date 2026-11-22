const mockStripeLog = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const mockFactoryCalls: { service: string | null; cfg: Record<string, unknown> }[] = [];
jest.mock('../../../../config/logging', () => {
  const actual = jest.requireActual('../../../../config/logging');
  // Every factory hands its service and overrides to one mock, as the real ones build one config.
  const factory = (service: string | null) => (overrides: Record<string, unknown> = {}) => {
    mockFactoryCalls.push({ service, cfg: overrides });
    return mockStripeLog;
  };
  return {
    ...actual,
    logService: { api: factory('api'), worker: factory('worker'), dbcli: factory('dbcli'), web: factory('web'), lib: factory(null) },
  };
});

import { attachStripeCallLogging, logStripeResponse } from '../stripe-call-log';

const event = (over: Record<string, unknown> = {}): any => ({
  method: 'POST',
  path: '/v1/subscriptions/sub_1?expand[]=x',
  status: 200,
  elapsed: 123,
  request_id: 'req_1',
  api_version: '2025-01-01',
  ...over,
});

describe('logStripeResponse', () => {
  it('AC-5: the Stripe logger is a lib logger on channel stripe, operation api-call', () => {
    expect(mockFactoryCalls).toEqual([{ service: null, cfg: { defaultOptions: { channel: 'stripe', operation: 'api-call' } } }]);
  });

  beforeEach(() => {
    Object.values(mockStripeLog).forEach((fn) => fn.mockReset());
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-16: a 200 is info "Stripe API call" with request id, no query, no headers', () => {
    logStripeResponse(event({ headers: { authorization: 'Bearer sk_live_SECRET' }, idempotency_key: 'IDEM' }));
    expect(mockStripeLog.info).toHaveBeenCalledTimes(1);
    const [message, extra] = mockStripeLog.info.mock.calls[0];
    expect(message).toBe('Stripe API call');
    // `method` is the HTTP verb (a string): it stays in extraInfo, it is not the numeric top-level field.
    expect(mockStripeLog.info.mock.calls[0]).toHaveLength(2);
    expect(extra).toEqual({ method: 'POST', path: '/v1/subscriptions/sub_1', status: 200, duration_ms: 123, api_version: '2025-01-01', stripe_request_id: 'req_1' });
    expect(JSON.stringify(mockStripeLog.info.mock.calls[0])).not.toMatch(/SECRET|IDEM|expand/);
  });

  it('AC-16: 402 is warn, 503 is error', () => {
    logStripeResponse(event({ status: 402 }));
    logStripeResponse(event({ status: 503 }));
    expect(mockStripeLog.warn).toHaveBeenCalledTimes(1);
    expect(mockStripeLog.error).toHaveBeenCalledTimes(1);
    expect(mockStripeLog.info).not.toHaveBeenCalled();
  });

  it('AC-16: a throwing logger never propagates', () => {
    mockStripeLog.info.mockImplementation(() => { throw new Error('disk'); });
    expect(() => logStripeResponse(event())).not.toThrow();
    expect(console.error).toHaveBeenCalled();
  });

  it('AC-16: attachStripeCallLogging subscribes once to "response"', () => {
    const on = jest.fn();
    attachStripeCallLogging({ on });
    expect(on).toHaveBeenCalledTimes(1);
    expect(on).toHaveBeenCalledWith('response', logStripeResponse);
  });

  it('AC-16: a client whose on() throws does not break construction', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => attachStripeCallLogging({ on: () => { throw new Error('x'); } })).not.toThrow();
  });
});
