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
  { id: 20, name: "Bird's-Eye View", type: 'TECHNIQUE' },
  { id: 21, name: 'Low Angle', type: 'TECHNIQUE' },
];

const offeredTypes = (prompt: string): string[] =>
  JSON.parse(prompt.split('CATEGORIES:\n')[1].split('\n')[0].trim()).map((c: { type: string }) => c.type);

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

  it('keeps the artist classification, offers only tags and techniques, and drops any other discipline it returns', async () => {
    const { service, promptOf } = setup([2, 20, 10, 11]);

    const result = await service.generateMediaMetadata(
      'https://img/1.webp',
      CATEGORIES,
      META,
      undefined,
      [CATEGORIES[0]],
    );

    // The artist's id leads; the model's discipline (2) is rejected; its technique and tags survive.
    expect(result.category_ids).toEqual([1, 20, 10, 11]);
    const prompt = promptOf();
    expect(prompt).toContain('ARTIST CATEGORIES');
    expect(prompt).toContain('Photography');
    expect(offeredTypes(prompt)).toEqual(['tags', 'tags', 'technique', 'technique']);
    expect(prompt).not.toContain('every DISCIPLINE and ART_STYLE that genuinely applies');
    expect(prompt).toContain('TECHNIQUES');
  });

  it('keeps the artist technique and still lets the model classify', async () => {
    const { service, promptOf } = setup([21, 2, 10]);

    const result = await service.generateMediaMetadata(
      'https://img/1.webp',
      CATEGORIES,
      META,
      undefined,
      [CATEGORIES[5]],
    );

    // The artist's technique (20) leads; the model's other technique (21) is not offered, so it is
    // rejected; the classification and tag it chose survive.
    expect(result.category_ids).toEqual([20, 2, 10]);
    const prompt = promptOf();
    expect(offeredTypes(prompt)).toEqual(['discipline', 'discipline', 'art_style', 'tags', 'tags']);
    expect(prompt).toContain('every DISCIPLINE and ART_STYLE that genuinely applies');
    expect(prompt).not.toContain('up to 3 TECHNIQUES');
  });

  it('never offers an artist-only category and rejects it if the model names it anyway', async () => {
    const withArtistOnly = [
      ...CATEGORIES,
      { id: 30, name: 'Focus Stacking', type: 'TECHNIQUE' as const, ai_selectable: false },
    ];
    const { service, promptOf } = setup([30, 20]);

    const result = await service.generateMediaMetadata('https://img/1.webp', withArtistOnly, META);

    expect(result.category_ids).toEqual([20]);
    expect(promptOf()).not.toContain('Focus Stacking');
  });

  it('still honours an artist-only category the artist picked', async () => {
    const stacked = { id: 30, name: 'Focus Stacking', type: 'TECHNIQUE' as const, ai_selectable: false };
    const { service, promptOf } = setup([21]);

    const result = await service.generateMediaMetadata(
      'https://img/1.webp',
      [...CATEGORIES, stacked],
      META,
      undefined,
      [stacked],
    );

    // Kept and led with; the technique kind is the artist's, so no other technique is accepted.
    expect(result.category_ids).toEqual([30]);
    expect(promptOf()).toContain('ARTIST CATEGORIES');
  });

  it('caps the techniques the model picks on its own', async () => {
    const many = [
      ...CATEGORIES,
      { id: 22, name: 'Dutch Angle', type: 'TECHNIQUE' as const },
      { id: 23, name: 'Rule of Thirds', type: 'TECHNIQUE' as const },
    ];
    const { service } = setup([20, 21, 22, 23]);

    const result = await service.generateMediaMetadata('https://img/1.webp', many, META);

    expect(result.category_ids).toEqual([20, 21, 22]);
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
