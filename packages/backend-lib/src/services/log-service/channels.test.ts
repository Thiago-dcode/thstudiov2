import { LOG_CHANNELS, LOG_CHANNEL_PATTERN, LogChannel } from './channels';
import { FileLogService } from './file-log.service';

describe('LOG_CHANNELS', () => {
  it('AC-12: has exactly 50 entries, sorted and unique', () => {
    expect(LOG_CHANNELS).toHaveLength(50);
    expect(new Set(LOG_CHANNELS).size).toBe(LOG_CHANNELS.length);
    expect([...LOG_CHANNELS]).toEqual([...LOG_CHANNELS].sort());
  });

  it.each([...LOG_CHANNELS])('AC-12: %s matches the pattern and has no slash', (channel) => {
    expect(channel).toMatch(LOG_CHANNEL_PATTERN);
    expect(channel).not.toContain('/');
  });

  it('AC-12: the pattern rejects paths, uppercase, ids and a second sub-channel', () => {
    for (const bad of ['api/errors', 'API', 'api.access.x', 'a b', '1api', '', 'api.', '../x']) {
      expect(LOG_CHANNEL_PATTERN.test(bad)).toBe(false);
    }
  });

  it('AC-12: includes the api.* HTTP core channels', () => {
    expect(LOG_CHANNELS).toEqual(expect.arrayContaining(['api', 'api.access', 'api.bootstrap', 'api.error', 'queue', 'stripe', 'storage']));
  });

  it('AC-12: channel typing rejects values outside the set at compile time', () => {
    const ok: LogChannel = 'media';
    expect(ok).toBe('media');
    // @ts-expect-error not a declared channel
    const bad: LogChannel = 'api/errors/500';
    expect(bad).toBeDefined();
    // @ts-expect-error a dynamic, id-bearing channel cannot compile
    new FileLogService({ channel: `user-${7}` });
  });
});
