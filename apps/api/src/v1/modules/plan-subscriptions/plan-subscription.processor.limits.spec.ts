jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({ stripe: {}, stripeWebhookSecret: '' }));
jest.mock('@repo/backend-lib/services/payment-service/paypal', () => ({ paypal: {} }));

const mockTables: string[] = [];
jest.mock('@repo/database/facades', () => {
  const chain = (table: string): any => {
    const q: any = {
      softDeletes: () => q,
      where: () => q,
      whereIn: () => q,
      orderBy: () => q,
      limit: () => q,
      select: () => q,
      rawSelect: () => q,
      count: async () => 0,
      first: async () => (table === 'media' ? { blocked_bytes: '0' } : null),
      get: async () => [],
      update: async () => ({ rowCount: 0 }),
    };
    return q;
  };
  return {
    Query: {
      table: (table: string) => {
        mockTables.push(table);
        return chain(table);
      },
    },
  };
});

import { consoleLogger, consoleRequestService } from 'src/common/testing/console-logger';
import { JOB_ON_SUBSCRIPTION_CHANGES } from '@repo/common-lib/constants/queues';
import { PlanSubscriptionProcessor } from './plan-subscription.processor';

const job: any = {
  id: 'ps-1',
  name: JOB_ON_SUBSCRIPTION_CHANGES,
  queueName: 'plan-subscriptions',
  attemptsMade: 0,
  // Same plan as before: the run ends before the email step.
  data: { id: 7, email: 'a@example.com', name: 'Ana', prevPlanId: 1, prevPlanName: 'Artist', prevPlanBasePrice: 0 },
  opts: { attempts: 3 },
};

describe('PlanSubscriptionProcessor entity limits', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockTables.length = 0;
  });

  it('AC-15: only portfolios, collections and services are evaluated; projects/clients are never queried', async () => {
    const lines: any[] = [];
    for (const method of ['log', 'warn', 'error'] as const) {
      jest.spyOn(console, method).mockImplementation((line: unknown) => {
        try { lines.push(JSON.parse(String(line))); } catch { /* not a log line */ }
      });
    }
    const logger = consoleLogger({ defaultOptions: { channel: 'plan-subscriptions', operation: 'on-subscription-changes' } });
    // Over every legacy cap: if projects/clients were still enforced, they would be queried and blocked.
    const plan = {
      id: 1, name: 'Artist', base_price: 0, storage_limit_mb: 10240,
      max_portfolios: 3, max_collections: 3, max_services: 3, max_projects: 0, max_clients: 0,
    };
    const extra = {
      storage_used_mb: 0, portfolios_count: 1, collections_count: 1, services_count: 1, projects_count: 50, clients_count: 50,
    };
    const processor = new PlanSubscriptionProcessor(
      consoleRequestService(logger),
      { findUserActivePlan: jest.fn().mockResolvedValue(plan) } as any,
      { findOneByUserId: jest.fn().mockResolvedValue(extra) } as any,
      { deleteManyCached: jest.fn().mockResolvedValue(undefined) } as any,
      { sendAsync: jest.fn() } as any,
      { setData: jest.fn() } as any,
      { emit: jest.fn() } as any,
    );

    await expect(processor.process(job)).resolves.toEqual({ success: true });

    expect(mockTables).not.toContain('projects');
    expect(mockTables).not.toContain('clients');
    for (const table of ['portfolios', 'collections', 'services']) expect(mockTables).toContain(table);
    const evaluated = lines.filter((l) => l.message === 'Entity limit diff computed').map((l) => l.extraInfo.table);
    expect(evaluated).toEqual(['portfolios', 'collections', 'services']);
  });
});
