const createLlmUsageJob = jest.fn();
const createMediaModerationJob = jest.fn();
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
