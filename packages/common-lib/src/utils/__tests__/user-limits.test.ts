import { BasePlan } from '../../types/plan';
import { UserExtraData } from '../../types/user-extra-data';
import { UserLimits } from '../user-limits';

const basePlan = (overrides: Partial<BasePlan> = {}): BasePlan => ({
  id: 1,
  stripe_id: null,
  paypal_id: null,
  name: 'Pro',
  short_description: '',
  description: '',
  logo: null,
  base_price: 0,
  is_active: true,
  is_popular: false,
  is_free: false,
  top_tier: false,
  storage_limit_mb: 100,
  max_projects: 5,
  max_portfolios: 3,
  max_services: 2,
  max_collections: 4,
  max_clients: 10,
  allow_media_compression: true,
  ai_credits: 50,
  limit_write_storage_per_day: 20,
  ...overrides,
});

const baseExtraData = (overrides: Partial<UserExtraData> = {}): UserExtraData => ({
  id: 1,
  storage_used_mb: 10,
  media_count: 0,
  projects_count: 1,
  clients_count: 0,
  services_count: 0,
  portfolios_count: 1,
  collections_count: 1,
  ai_credits: 10,
  ai_credits_consumed: 5,
  next_ai_credits_reset: new Date('2026-09-01'),
  last_ai_credits_reset: new Date('2026-08-01'),
  account_strikes: 0,
  ban_count: 0,
  ban_lift: new Date('2020-01-01'),
  ban_start: new Date('2020-01-01'),
  user_id: 42,
  ...overrides,
});

describe('UserLimits.storageSize', () => {
  it('allows when under the plan cap', () => {
    expect(
      UserLimits.storageSize({
        userExtraData: baseExtraData({ storage_used_mb: 10 }),
        userPlan: basePlan({ storage_limit_mb: 100 }),
        incomingSize: 50,
      }),
    ).toBe(true);
  });

  it('allows when exactly at the cap', () => {
    expect(
      UserLimits.storageSize({
        userExtraData: baseExtraData({ storage_used_mb: 90 }),
        userPlan: basePlan({ storage_limit_mb: 100 }),
        incomingSize: 10,
      }),
    ).toBe(true);
  });

  it('denies when over the cap', () => {
    expect(
      UserLimits.storageSize({
        userExtraData: baseExtraData({ storage_used_mb: 90 }),
        userPlan: basePlan({ storage_limit_mb: 100 }),
        incomingSize: 11,
      }),
    ).toBe(false);
  });

  it('allows unlimited plans (-1)', () => {
    expect(
      UserLimits.storageSize({
        userExtraData: baseExtraData({ storage_used_mb: 9999 }),
        userPlan: basePlan({ storage_limit_mb: -1 }),
        incomingSize: 9999,
      }),
    ).toBe(true);
  });
});

describe('UserLimits.accountStrikes', () => {
  const now = new Date('2026-08-27T12:00:00.000Z');

  it('allows when ban_lift is in the past', () => {
    expect(
      UserLimits.accountStrikes({
        userExtraData: baseExtraData({ ban_lift: new Date('2026-01-01') }),
        now,
      }),
    ).toBe(true);
  });

  it('denies when ban_lift is in the future', () => {
    expect(
      UserLimits.accountStrikes({
        userExtraData: baseExtraData({ ban_lift: new Date('2027-01-01') }),
        now,
      }),
    ).toBe(false);
  });
});

describe('UserLimits.mediaCompression', () => {
  it('allows when plan permits compression', () => {
    expect(
      UserLimits.mediaCompression({
        userPlan: basePlan({ allow_media_compression: true }),
      }),
    ).toBe(true);
  });

  it('denies when plan forbids compression', () => {
    expect(
      UserLimits.mediaCompression({
        userPlan: basePlan({ allow_media_compression: false }),
      }),
    ).toBe(false);
  });
});

describe('UserLimits.aiCredits', () => {
  it('allows when consumed credits are below the total', () => {
    expect(
      UserLimits.aiCredits({
        userExtraData: baseExtraData({ ai_credits: 10, ai_credits_consumed: 50 }),
        userPlan: basePlan({ ai_credits: 50 }),
      }),
    ).toBe(true);
  });

  it('denies when consumed credits reached the total', () => {
    expect(
      UserLimits.aiCredits({
        userExtraData: baseExtraData({ ai_credits: 10, ai_credits_consumed: 60 }),
        userPlan: basePlan({ ai_credits: 50 }),
      }),
    ).toBe(false);
  });

  it('denies when consumed credits exceed the total', () => {
    expect(
      UserLimits.aiCredits({
        userExtraData: baseExtraData({ ai_credits: 10, ai_credits_consumed: 70 }),
        userPlan: basePlan({ ai_credits: 50 }),
      }),
    ).toBe(false);
  });
});

describe('UserLimits.dailyStorageRequests', () => {
  it('allows when under the daily cap', () => {
    expect(
      UserLimits.dailyStorageRequests({
        userPlan: basePlan({ limit_write_storage_per_day: 20 }),
        currentRequests: 10,
        incomingRequests: 5,
      }),
    ).toBe(true);
  });

  it('denies when over the daily cap', () => {
    expect(
      UserLimits.dailyStorageRequests({
        userPlan: basePlan({ limit_write_storage_per_day: 20 }),
        currentRequests: 18,
        incomingRequests: 3,
      }),
    ).toBe(false);
  });

  it('allows unlimited daily requests (-1)', () => {
    expect(
      UserLimits.dailyStorageRequests({
        userPlan: basePlan({ limit_write_storage_per_day: -1 }),
        currentRequests: 999,
        incomingRequests: 999,
      }),
    ).toBe(true);
  });
});

describe('UserLimits.entityCount', () => {
  it('allows when under the entity cap', () => {
    expect(
      UserLimits.entityCount({
        currentCount: 1,
        incomingCount: 2,
        maxAllowed: 5,
      }),
    ).toBe(true);
  });

  it('denies when over the entity cap', () => {
    expect(
      UserLimits.entityCount({
        currentCount: 4,
        incomingCount: 2,
        maxAllowed: 5,
      }),
    ).toBe(false);
  });

  it('allows unlimited entities (-1)', () => {
    expect(
      UserLimits.entityCount({
        currentCount: 100,
        incomingCount: 100,
        maxAllowed: -1,
      }),
    ).toBe(true);
  });
});
