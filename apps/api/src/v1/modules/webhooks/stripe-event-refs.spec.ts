import { stripeEventRefs } from './stripe-event-refs';

const event = (type: string, object: Record<string, unknown>, request: unknown = { id: 'req_1' }): any => ({
  id: 'evt_1',
  type,
  created: 1_800_000_000,
  request,
  data: { object },
});

describe('stripeEventRefs', () => {
  it('AC-22: checkout.session gives session, customer, subscription, metadata and user_id from client_reference_id', () => {
    const { correlation, metadata } = stripeEventRefs(
      event('checkout.session.completed', {
        object: 'checkout.session',
        id: 'cs_1',
        customer: 'cus_1',
        subscription: 'sub_1',
        client_reference_id: '42',
        metadata: { requestId: 'R', requestAt: '1' },
      }),
    );
    expect(correlation).toEqual({
      stripe_event_id: 'evt_1',
      stripe_event_type: 'checkout.session.completed',
      stripe_request_id: 'req_1',
      stripe_checkout_session_id: 'cs_1',
      stripe_customer_id: 'cus_1',
      stripe_subscription_id: 'sub_1',
      user_id: 42,
    });
    expect(metadata).toEqual({ requestId: 'R', requestAt: '1' });
  });

  it('AC-22: checkout.session falls back to metadata.user_id', () => {
    const { correlation } = stripeEventRefs(
      event('checkout.session.completed', { object: 'checkout.session', id: 'cs_1', metadata: { user_id: '7' } }),
    );
    expect(correlation.user_id).toBe(7);
  });

  it('AC-22: customer.subscription.updated gives subscription, customer (expanded object ok) and metadata user_id', () => {
    const { correlation, metadata } = stripeEventRefs(
      event('customer.subscription.updated', {
        object: 'subscription',
        id: 'sub_1',
        customer: { id: 'cus_9' },
        metadata: { user_id: '5', requestId: 'R' },
      }),
    );
    expect(correlation).toMatchObject({ stripe_subscription_id: 'sub_1', stripe_customer_id: 'cus_9', user_id: 5 });
    expect(metadata).toEqual({ user_id: '5', requestId: 'R' });
  });

  it('AC-22: invoice with parent.subscription_details (current API)', () => {
    const { correlation, metadata } = stripeEventRefs(
      event('invoice.paid', {
        object: 'invoice',
        id: 'in_1',
        customer: 'cus_1',
        parent: { subscription_details: { subscription: 'sub_2', metadata: { user_id: '3' } } },
      }),
    );
    expect(correlation).toMatchObject({ stripe_invoice_id: 'in_1', stripe_customer_id: 'cus_1', stripe_subscription_id: 'sub_2', user_id: 3 });
    expect(metadata).toEqual({ user_id: '3' });
  });

  it('AC-22: invoice with legacy subscription_details / subscription', () => {
    const { correlation, metadata } = stripeEventRefs(
      event('invoice.payment_failed', {
        object: 'invoice',
        id: 'in_2',
        customer: 'cus_1',
        subscription: 'sub_3',
        subscription_details: { metadata: { user_id: '4' } },
      }),
    );
    expect(correlation).toMatchObject({ stripe_invoice_id: 'in_2', stripe_subscription_id: 'sub_3', user_id: 4 });
    expect(metadata).toEqual({ user_id: '4' });
  });

  it.each(['payment_intent', 'payment_method'])('AC-22: %s gives the customer only', (kind) => {
    const { correlation, metadata } = stripeEventRefs(
      event(`${kind}.succeeded`, { object: kind, id: 'x_1', customer: 'cus_5', metadata: { user_id: '1' } }),
    );
    expect(correlation).toEqual({
      stripe_event_id: 'evt_1',
      stripe_event_type: `${kind}.succeeded`,
      stripe_request_id: 'req_1',
      stripe_customer_id: 'cus_5',
    });
    expect(metadata).toBeNull();
  });

  it('AC-22: an unknown type gives only the event ids', () => {
    const { correlation, metadata } = stripeEventRefs(event('charge.refunded', { object: 'charge', id: 'ch_1', customer: 'cus_1' }));
    expect(correlation).toEqual({ stripe_event_id: 'evt_1', stripe_event_type: 'charge.refunded', stripe_request_id: 'req_1' });
    expect(metadata).toBeNull();
  });

  it('AC-22: event.request.id maps to stripe_request_id; a null request gives none', () => {
    expect(stripeEventRefs(event('x', {}, { id: 'req_77' })).correlation.stripe_request_id).toBe('req_77');
    expect(stripeEventRefs(event('x', {}, null)).correlation.stripe_request_id).toBeUndefined();
  });

  it.each(['abc', '0', '-3', '1.5', '', '99999999999999999999'])('AC-22: metadata.user_id %j gives no user_id', (raw) => {
    const { correlation } = stripeEventRefs(
      event('customer.subscription.updated', { object: 'subscription', id: 's', metadata: { user_id: raw } }),
    );
    expect('user_id' in correlation).toBe(false);
  });

  it('AC-22: never returns the Stripe object', () => {
    const { correlation } = stripeEventRefs(
      event('customer.subscription.updated', { object: 'subscription', id: 's', items: { data: [1] }, customer: 'c' }),
    );
    expect(JSON.stringify(correlation)).not.toContain('items');
  });
});
