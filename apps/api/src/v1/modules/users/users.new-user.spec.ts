const mockStripe = { customers: { create: jest.fn() } };
jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: mockStripe,
  stripeWebhookSecret: '',
}));
jest.mock('@repo/backend-lib/utils', () => ({
  ...jest.requireActual('@repo/backend-lib/utils'),
  QueueHelper: {
    createGenerateSingleEntityMetadataJob: jest.fn(),
    createOrUpdateEmailPreferenceJob: jest.fn(),
  },
}));

import { LogService } from '@repo/backend-lib/services/log-service';
import { runWithTraceId } from 'src/common/services/request-storage';
import { consoleLogger } from 'src/common/testing/console-logger';
import { UserService } from './users.service';
import { NotifyNewUserMail } from './mails/notify-new-user.mail';

const EMAIL = 'fresh@example.test';
const event = { user: { id: 9, username: 'freshname', email: EMAIL, language: 'EN' } };

const build = () => {
  const lines: any[] = [];
  for (const method of ['log', 'warn', 'error'] as const) {
    jest.spyOn(console, method).mockImplementation((line: unknown) => {
      try { lines.push(JSON.parse(String(line))); } catch { /* not a log line */ }
    });
  }
  const logService = consoleLogger({ channel: 'users' });
  const nameSpy = jest.spyOn(logService, 'name');
  const userRepository = {
    updateById: jest.fn().mockResolvedValue({}),
    findByIdCompact: jest.fn().mockResolvedValue({ ...event.user, name: 'Fresh Name', language: 'ES' }),
  };
  const welcomeMail = { setUser: jest.fn().mockReturnValue({}) };
  const eventEmitter = { emitAsync: jest.fn().mockResolvedValue([]), emit: jest.fn() };
  const mailService = { sendAsync: jest.fn().mockResolvedValue(null) };
  const service = new UserService(
    userRepository as never,
    eventEmitter as never,
    logService as unknown as LogService,
    mailService as never,
    { deleteManyCached: jest.fn().mockResolvedValue(undefined) } as never,
    { user: { id: 9 } } as never,
    welcomeMail as never,
    {} as never,
    { create: jest.fn().mockResolvedValue(undefined) } as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return { service, lines, nameSpy, userRepository, eventEmitter, welcomeMail };
};

const customer = { id: 'cus_new', object: 'customer', email: EMAIL, phone: '+34600000000', address: { line1: 'Street 1' } };

describe('UserService.handleNewUserEvent logging', () => {
  beforeEach(() => {
    mockStripe.customers.create.mockReset();
    const { QueueHelper } = jest.requireMock('@repo/backend-lib/utils');
    QueueHelper.createOrUpdateEmailPreferenceJob.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('AC-21: customers.create gets metadata with user_id and the trace id', async () => {
    mockStripe.customers.create.mockResolvedValue(customer);
    const { service } = build();
    await runWithTraceId('R', () => service.handleNewUserEvent(event as never));
    const params = mockStripe.customers.create.mock.calls[0][0];
    expect(params.metadata).toMatchObject({ user_id: '9', requestId: 'R' });
    expect(params.metadata.requestAt).toMatch(/^\d+$/);
  });

  it('AC-21: "Stripe customer created" has the customer id and no email, phone or address anywhere', async () => {
    mockStripe.customers.create.mockResolvedValue(customer);
    const { service, lines } = build();
    await runWithTraceId('R', () => service.handleNewUserEvent(event as never));
    const [created] = lines.filter((l) => l.message === 'Stripe customer created');
    expect(created.extraInfo).toMatchObject({ user_id: 9, stripe_customer_id: 'cus_new' });
    expect(created.operation).toBe('new-user');
    expect(created.id).toBe('R');
    const dumped = JSON.stringify(lines);
    expect(dumped).not.toContain(EMAIL);
    expect(dumped).not.toContain('+34600000000');
    expect(dumped).not.toContain('Street 1');
    expect(dumped).not.toContain('"object":"customer"');
    expect(lines.some((l) => l.message === 'New user onboarding completed')).toBe(true);
  });

  it('AC-21: customers.create rejecting logs exactly one critical and rethrows', async () => {
    const failure = new Error('stripe unreachable');
    mockStripe.customers.create.mockRejectedValue(failure);
    const { service, lines } = build();
    await expect(service.handleNewUserEvent(event as never)).rejects.toBe(failure);
    const criticals = lines.filter((l) => l.level === 'CRITICAL');
    expect(criticals).toHaveLength(1);
    expect(criticals[0].message).toBe('Stripe customer creation failed for new user');
    expect(criticals[0].extraInfo).toMatchObject({ step: 'stripe-customer', error_message: 'stripe unreachable' });
    expect(criticals[0].extraInfo.user_id).toBe(9);
    expect(lines.filter((l) => l.message === 'New user onboarding failed')).toHaveLength(0);
  });

  it('Round 1: an address quoted in the Stripe error is masked in error_message', async () => {
    mockStripe.customers.create.mockRejectedValue(new Error('Invalid email: ross@example.com'));
    const { service, lines } = build();
    await expect(service.handleNewUserEvent(event as never)).rejects.toThrow();
    const [critical] = lines.filter((l) => l.level === 'CRITICAL');
    expect(critical.extraInfo.error_message).toBe('Invalid email: [email]');
    expect(JSON.stringify(lines)).not.toContain('ross@example.com');
  });

  it('AC-21: storing the customer id failing is also critical', async () => {
    mockStripe.customers.create.mockResolvedValue(customer);
    const { service, lines, userRepository } = build();
    userRepository.updateById.mockRejectedValue(new Error('db down'));
    await expect(service.handleNewUserEvent(event as never)).rejects.toThrow('db down');
    const criticals = lines.filter((l) => l.level === 'CRITICAL');
    expect(criticals).toHaveLength(1);
    expect(criticals[0].extraInfo.step).toBe('store-customer');
  });

  it('AC-21: a free-plan step failure logs error "New user onboarding failed" {step} and no critical', async () => {
    mockStripe.customers.create.mockResolvedValue(customer);
    const { service, lines, eventEmitter } = build();
    eventEmitter.emitAsync.mockRejectedValueOnce(new Error('plan missing'));
    await expect(service.handleNewUserEvent(event as never)).rejects.toThrow('plan missing');
    expect(lines.filter((l) => l.level === 'CRITICAL')).toHaveLength(0);
    const [failed] = lines.filter((l) => l.message === 'New user onboarding failed');
    expect(failed.level).toBe('ERROR');
    expect(failed.extraInfo).toMatchObject({ step: 'free-plan' });
  });

  it('AC-21: the shared logger is never renamed', async () => {
    mockStripe.customers.create.mockResolvedValue(customer);
    const { service, nameSpy } = build();
    await service.handleNewUserEvent(event as never);
    expect(nameSpy).not.toHaveBeenCalled();
  });

  it('the welcome mail gets the user reloaded with its profile name, not the core event user', async () => {
    mockStripe.customers.create.mockResolvedValue(customer);
    const { service, userRepository, welcomeMail } = build();
    await service.handleNewUserEvent(event as never);
    expect(userRepository.findByIdCompact).toHaveBeenCalledWith(9);
    expect(welcomeMail.setUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Fresh Name', username: 'freshname', email: EMAIL }),
      'ES',
    );
  });

  it('Fix 3: the Stripe customer is named after name and surname, never the username', async () => {
    mockStripe.customers.create.mockResolvedValue(customer);
    const { service, userRepository } = build();
    userRepository.findByIdCompact.mockResolvedValue({ ...event.user, name: ' Ana ', surname: 'Silva', language: 'EN' });
    await service.handleNewUserEvent(event as never);
    expect(mockStripe.customers.create.mock.calls[0][0].business_name).toBe('Ana Silva');
  });

  it('Fix 3: without a name the Stripe customer gets no name at all', async () => {
    mockStripe.customers.create.mockResolvedValue(customer);
    const { service, userRepository } = build();
    userRepository.findByIdCompact.mockResolvedValue({ ...event.user, name: null, surname: null, language: 'EN' });
    await service.handleNewUserEvent(event as never);
    const params = mockStripe.customers.create.mock.calls[0][0];
    expect(params).not.toHaveProperty('business_name');
    expect(JSON.stringify(params)).not.toContain('freshname');
  });
});

describe('NotifyNewUserMail greeting', () => {
  const build = () => {
    const viewService = { render: jest.fn().mockResolvedValue('<p>hi</p>') };
    const i18nService = {
      translate: jest.fn((key: string, options?: { args?: Record<string, string> }) =>
        options?.args?.name ? `${key}(${options.args.name})` : key),
    };
    const configService = { get: jest.fn().mockReturnValue('https://app.test') };
    const mail = new NotifyNewUserMail(viewService as never, undefined as never, i18nService as never, configService as never);
    return { mail, viewService };
  };

  it('Fix 1: greets by name in the subject and the body when there is one', async () => {
    const { mail, viewService } = build();
    const welcome = mail.setUser({ email: EMAIL, name: ' Ana ' }, 'EN');

    expect((await welcome.envelope()).subject).toBe('notify-new-user-email.WELCOME_SUBJECT(Ana)');
    await welcome.content();
    expect(viewService.render.mock.calls[0][1]).toMatchObject({ greetingName: 'Ana' });
  });

  it('Fix 1: without a name uses the nameless subject and greeting, never the username', async () => {
    const { mail, viewService } = build();
    const welcome = mail.setUser({ email: EMAIL, name: null, username: 'artistk3x9q2mf' } as never, 'EN');

    const { subject } = await welcome.envelope();
    expect(subject).toBe('notify-new-user-email.WELCOME_SUBJECT_NO_NAME');
    await welcome.content();
    const data = viewService.render.mock.calls[0][1];
    expect(data.greetingName).toBeNull();
    expect(JSON.stringify({ subject, data })).not.toContain('artistk3x9q2mf');
  });
});
