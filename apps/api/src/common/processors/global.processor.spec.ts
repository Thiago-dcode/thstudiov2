import { redactJobData } from './global.processor';

describe('redactJobData', () => {
  it('replaces email bodies with their size, single and batch', () => {
    const single = { to: 'a@b.c', subject: 'Your code', html: '<p>123456</p>', text: '123456' };
    expect(redactJobData(single)).toEqual({
      to: 'a@b.c',
      subject: 'Your code',
      html: '[redacted, 13 chars]',
      text: '[redacted, 6 chars]',
    });
    expect(redactJobData([single])).toEqual([expect.objectContaining({ html: '[redacted, 13 chars]' })]);
  });

  it('leaves other payloads untouched', () => {
    expect(redactJobData({ user_id: 7, media: { id: 1 } })).toEqual({ user_id: 7, media: { id: 1 } });
    expect(redactJobData(null)).toBeNull();
  });
});
