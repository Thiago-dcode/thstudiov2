const createLlmUsageJob = jest.fn();
const createMediaModerationJob = jest.fn();
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), critical: jest.fn() };
const mockLibConfigs: Record<string, any>[] = [];
jest.mock('../../../config/logging', () => ({
  ...jest.requireActual('../../../config/logging'),
  logService: {
    lib: (overrides: Record<string, any>) => {
      mockLibConfigs.push(overrides);
      return mockLogger;
    },
  },
}));
jest.mock('@repo/backend-lib/utils', () => ({
  QueueHelper: {
    createLlmUsageJob: (...args: unknown[]) => createLlmUsageJob(...args),
    createMediaModerationJob: (...args: unknown[]) => createMediaModerationJob(...args),
  },
}));
jest.mock('../../../utils/critical-alert-mail', () => ({ criticalAlertMail: jest.fn() }));

import { AiService } from '../ai.service';
import type { LLMService } from '@repo/backend-lib/services/llm-service';

const LOG = { id: 'TRACE-1' };
const usage = { totalTokens: 42 };

const setup = (text: string) => {
  const complete = jest.fn().mockResolvedValue({ text, usage });
  return AiService.instance({ complete } as unknown as LLMService);
};

describe('AiService logs through lib loggers built per operation (AC-5)', () => {
  beforeEach(() => {
    mockLibConfigs.length = 0;
    Object.values(mockLogger).forEach((fn) => fn.mockReset());
    createLlmUsageJob.mockReset().mockResolvedValue(undefined);
    createMediaModerationJob.mockReset().mockResolvedValue(undefined);
  });

  it('moderateContent logs on channel ai with operation moderate-content, in the defaults, with two-argument calls', async () => {
    const service = setup(JSON.stringify({ is_allowed: true, severity: 0, content_type: 'photo', reason: '' }));
    await service.moderateContent('https://img/1.webp', { user_id: 3 });
    expect(mockLibConfigs.length).toBeGreaterThan(0);
    for (const config of mockLibConfigs) expect(config).toEqual({ defaultOptions: { channel: 'ai', operation: 'moderate-content' } });
    expect(mockLogger.warn.mock.calls[0][0]).toBe('Starting to moderate content');
    expect(mockLogger.info.mock.calls[0][0]).toBe('Successfully moderated content');
    for (const call of [...mockLogger.warn.mock.calls, ...mockLogger.info.mock.calls]) expect(call).toHaveLength(2);
  });

  it('a failure is a critical line with the Error passed alone as the options', async () => {
    const complete = jest.fn().mockRejectedValue(new Error('model down'));
    const service = AiService.instance({ complete } as unknown as LLMService);
    await expect(service.moderateContent('https://img/1.webp', { user_id: 3 })).rejects.toThrow('model down');
    expect(mockLogger.critical).toHaveBeenCalledTimes(1);
    const [message, options] = mockLogger.critical.mock.calls[0];
    expect(message).toContain('Failed to moderate content for user [3]');
    expect(options).toBeInstanceOf(Error);
    expect(mockLogger.critical.mock.calls[0]).toHaveLength(2);
  });

  it('generateMediaMetadata logs under its own operation', async () => {
    const service = setup('not json');
    await service.generateMediaMetadata('https://img/1.webp', [], { media_id: 1, user_id: 3, media_type: 'IMAGE' }).catch(() => undefined);
    expect(mockLibConfigs.length).toBeGreaterThan(0);
    for (const config of mockLibConfigs) expect(config).toEqual({ defaultOptions: { channel: 'ai', operation: 'generate-media-metadata' } });
  });
});

describe('AiService forwards the caller log config to the jobs it creates', () => {
  beforeEach(() => {
    createLlmUsageJob.mockReset().mockResolvedValue(undefined);
    createMediaModerationJob.mockReset().mockResolvedValue(undefined);
  });

  it('AC-19: moderateContent passes `log` to the usage job and to the moderation job', async () => {
    const service = setup(JSON.stringify({ is_allowed: true, severity: 0, content_type: 'photo', reason: '' }));
    await service.moderateContent('https://img/1.webp', { user_id: 3 }, LOG);
    expect(createLlmUsageJob).toHaveBeenCalledTimes(1);
    expect(createLlmUsageJob.mock.calls[0][1]).toBe(LOG);
    expect(createMediaModerationJob).toHaveBeenCalledTimes(1);
    expect(createMediaModerationJob.mock.calls[0][1]).toBe(LOG);
  });

  it('AC-19: moderateContent without a log passes the default empty config, not undefined data loss', async () => {
    const service = setup(JSON.stringify({ is_allowed: true, severity: 0, content_type: 'photo', reason: '' }));
    await service.moderateContent('https://img/1.webp', { user_id: 3 });
    expect(createMediaModerationJob.mock.calls[0][1]).toEqual({});
  });

  it('AC-19: generateMediaMetadata passes `log` to the usage job', async () => {
    const service = setup(
      JSON.stringify({
        seo_filename: 'a-dog',
        category_ids: [],
        translations: { EN: { seo_title: 'A dog', seo_description: 'A dog runs.', seo_alt: 'A dog' } },
      }),
    );
    await service.generateMediaMetadata('https://img/1.webp', [], { media_id: 1, user_id: 3, media_type: 'IMAGE' }, undefined, [], LOG);
    expect(createLlmUsageJob).toHaveBeenCalledTimes(1);
    expect(createLlmUsageJob.mock.calls[0][1]).toBe(LOG);
  });

  it('AC-19: the entity metadata methods (user profile) pass `log` to the usage job', async () => {
    const service = setup(JSON.stringify({ translations: { EN: { seo_title: 'T', seo_description: 'D' } } }));
    await service.generateUserMetadata({ name: 'Ana', categories: [] } as never, { user_id: 3 }, LOG);
    expect(createLlmUsageJob).toHaveBeenCalledTimes(1);
    expect(createLlmUsageJob.mock.calls[0][1]).toBe(LOG);
  });
});
