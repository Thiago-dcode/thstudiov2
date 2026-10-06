import { AiService } from './ai.service';
import type { LLMService } from '@repo/backend-lib/services/llm-service/base';
import type { MediaMetadataPromptCategory } from '@repo/common-lib/types/ai';

jest.mock('@repo/backend-lib/services/log-service', () => {
  const logger = { name: () => logger, channel: () => logger, info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  return { FactoryLogService: { createLogService: () => logger } };
});
jest.mock('@repo/backend-lib/utils', () => ({
  QueueHelper: { createLlmUsageJob: jest.fn() },
  callback500ErrorMail: jest.fn(),
}));

const CATEGORIES: MediaMetadataPromptCategory[] = [
  { id: 1, name: 'Photography', type: 'DISCIPLINE' },
  { id: 2, name: 'Illustration', type: 'DISCIPLINE' },
  { id: 3, name: 'Minimalism', type: 'ART_STYLE' },
  { id: 10, name: 'dog', type: 'TAGS' },
  { id: 11, name: 'beach', type: 'TAGS' },
];

const META = { media_id: 1, user_id: 1, media_type: 'IMAGE' as const };

/** A model reply that, deliberately, also tries to pick a discipline the artist did not choose. */
const reply = (category_ids: number[]) => ({
  text: JSON.stringify({
    seo_filename: 'a-dog-on-the-beach',
    category_ids,
    translations: { EN: { seo_title: 'A dog on the beach', seo_description: 'A dog runs along the shore.', seo_alt: 'A dog on a beach' } },
  }),
  usage: undefined,
});

const setup = (category_ids: number[]) => {
  const complete = jest.fn().mockResolvedValue(reply(category_ids));
  const service = AiService.instance({ complete } as unknown as LLMService);
  const promptOf = () => {
    const content = complete.mock.calls[0][0].messages[1].content as { type: string; text?: string }[];
    return content.find((part) => part.type === 'text')!.text!;
  };
  return { service, promptOf };
};

describe('AiService.generateMediaMetadata categories', () => {
  it('classifies on its own when the artist picked nothing', async () => {
    const { service, promptOf } = setup([1, 3, 10]);

    const result = await service.generateMediaMetadata('https://img/1.webp', CATEGORIES, META);

    expect(result.category_ids).toEqual([1, 3, 10]);
    expect(promptOf()).toContain('every DISCIPLINE and ART_STYLE that genuinely applies');
    expect(promptOf()).not.toContain('ARTIST CATEGORIES');
  });

  it('keeps the artist categories, offers the model only tags, and drops any other discipline it returns', async () => {
    const { service, promptOf } = setup([2, 10, 11]);

    const result = await service.generateMediaMetadata(
      'https://img/1.webp',
      CATEGORIES,
      META,
      undefined,
      [CATEGORIES[0]],
    );

    // The artist's id leads; the model's discipline (2) is rejected; its tags survive.
    expect(result.category_ids).toEqual([1, 10, 11]);
    const prompt = promptOf();
    expect(prompt).toContain('ARTIST CATEGORIES');
    expect(prompt).toContain('Photography');
    const offered = JSON.parse(prompt.split('CATEGORIES:\n')[1].split('\n')[0].trim());
    expect(offered.map((c: { type: string }) => c.type)).toEqual(['tags', 'tags']);
  });

  it('drops the video "pick a discipline" rule when the artist already chose, and keeps it otherwise', async () => {
    const video = { ...META, media_type: 'VIDEO' as const };

    const chosen = setup([10]);
    await chosen.service.generateMediaMetadata('https://img/1.webp', CATEGORIES, video, undefined, [CATEGORIES[0]]);
    expect(chosen.promptOf()).not.toContain('pick the film/video/motion one');
    expect(chosen.promptOf()).toContain('THE MEDIUM IS VIDEO');

    const open = setup([1]);
    await open.service.generateMediaMetadata('https://img/1.webp', CATEGORIES, video);
    expect(open.promptOf()).toContain('pick the film/video/motion one');
  });

  it('returns no categories on an unparseable reply, so the caller leaves the stored ones alone', async () => {
    const complete = jest.fn().mockResolvedValue({ text: 'not json', usage: undefined });
    const service = AiService.instance({ complete } as unknown as LLMService);

    const result = await service.generateMediaMetadata(
      'https://img/1.webp',
      CATEGORIES,
      META,
      undefined,
      [CATEGORIES[0]],
    );

    expect(result.category_ids).toEqual([]);
  });
});
