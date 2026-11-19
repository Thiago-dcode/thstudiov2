import { isSensitivePathParam, redactRoutePath } from '../redact';

describe('isSensitivePathParam', () => {
  it.each(['token', 'Token', 'code', 'CODE', 'password', 'access_token', 'secret'])('flags %s', (name) => {
    expect(isSensitivePathParam(name)).toBe(true);
  });

  it.each(['id', 'slug', 'username', 'category', 'page'])('does not flag %s', (name) => {
    expect(isSensitivePathParam(name)).toBe(false);
  });
});

describe('redactRoutePath', () => {
  it('returns null when no route is matched', () => {
    expect(redactRoutePath('/api/v1/x/SECRETP', undefined, {})).toBeNull();
    expect(redactRoutePath('/api/v1/x/SECRETP', null, {})).toBeNull();
    expect(redactRoutePath('/api/v1/x/SECRETP', '', {})).toBeNull();
  });

  it('keeps the path when the route has no sensitive param', () => {
    expect(redactRoutePath('/api/v1/media/5', '/api/v1/media/:id', { id: '5' })).toBe('/api/v1/media/5');
    expect(redactRoutePath('/api/v1/media', '/api/v1/media', null)).toBe('/api/v1/media');
  });

  it('masks a token param', () => {
    expect(
      redactRoutePath(
        '/api/v1/email-preferences/SECRETP/token',
        '/api/v1/email-preferences/:token/token',
        { token: 'SECRETP' },
      ),
    ).toBe('/api/v1/email-preferences/:token/token');
  });

  it('masks a code param', () => {
    expect(
      redactRoutePath('/api/v1/invitation-links/ABC123/code', '/api/v1/invitation-links/:code/code', {
        code: 'ABC123',
      }),
    ).toBe('/api/v1/invitation-links/:code/code');
    expect(
      redactRoutePath('/api/v1/wait-list/invitation/ABC123', '/api/v1/wait-list/invitation/:code', {
        code: 'ABC123',
      }),
    ).toBe('/api/v1/wait-list/invitation/:code');
  });

  it('masks only the sensitive param and keeps ordinary ones', () => {
    expect(
      redactRoutePath('/api/v1/users/42/verify/SECRETP', '/api/v1/users/:id/verify/:token', {
        id: '42',
        token: 'SECRETP',
      }),
    ).toBe('/api/v1/users/42/verify/:token');
  });

  it('masks several sensitive params', () => {
    expect(
      redactRoutePath('/a/SECRETA/b/SECRETB', '/a/:token/b/:code', { token: 'SECRETA', code: 'SECRETB' }),
    ).toBe('/a/:token/b/:code');
  });

  it('matches a percent-encoded segment against the decoded param', () => {
    const out = redactRoutePath('/api/v1/wait-list/invitation/a%2Bb', '/api/v1/wait-list/invitation/:code', {
      code: 'a+b',
    });
    expect(out).toBe('/api/v1/wait-list/invitation/:code');
  });

  it('matches a raw (still encoded) param value too', () => {
    const out = redactRoutePath('/x/a%2Bb', '/x/:code', { code: 'a%2Bb' });
    expect(out).toBe('/x/:code');
  });

  it('does not throw on a malformed percent sequence', () => {
    const out = redactRoutePath('/x/%E0%A4%A', '/x/:code', { code: '%E0%A4%A' });
    expect(out).not.toContain('%E0');
  });

  it('falls back to the template when a wildcard param is an array', () => {
    expect(redactRoutePath('/files/SECRETP/more', '/files/*code', { code: ['SECRETP', 'more'] })).toBe('/files/*code');
    expect(redactRoutePath('/files/SECRETP', '/files/*token', { token: ['SECRETP'] })).toBe('/files/*token');
  });

  it('falls back to the template when the sensitive param is missing, empty or not a string', () => {
    expect(redactRoutePath('/x/SECRETP', '/x/:token', {})).toBe('/x/:token');
    expect(redactRoutePath('/x/SECRETP', '/x/:token', null)).toBe('/x/:token');
    expect(redactRoutePath('/x/SECRETP', '/x/:token', undefined)).toBe('/x/:token');
    expect(redactRoutePath('/x/SECRETP', '/x/:token', { token: '' })).toBe('/x/:token');
    expect(redactRoutePath('/x/SECRETP', '/x/:token', { token: 5 })).toBe('/x/:token');
  });

  it('falls back to the template when the value still appears inside a static segment (code=1 in v1)', () => {
    const out = redactRoutePath('/api/v1/invitation/1', '/api/v1/invitation/:code', { code: '1' });
    expect(out).toBe('/api/v1/invitation/:code');
  });

  it('falls back to the template when the value equals the param name (token=token)', () => {
    const out = redactRoutePath('/api/token/token', '/api/token/:token', { token: 'token' });
    expect(out).toBe('/api/token/:token');
  });

  it('never returns a string that contains the raw secret', () => {
    const cases: Array<[string, string, Record<string, unknown>, string]> = [
      ['/e/SECRETP/token', '/e/:token/token', { token: 'SECRETP' }, 'SECRETP'],
      ['/i/SECRETP/code', '/i/:code/code', { code: 'SECRETP' }, 'SECRETP'],
      ['/w/SECRETP', '/w/:code', {}, 'SECRETP'],
      ['/f/SECRETP', '/f/*code', { code: ['SECRETP'] }, 'SECRETP'],
    ];
    for (const [p, route, params, secret] of cases) {
      const out = redactRoutePath(p, route, params);
      expect(out).not.toBeNull();
      expect(out).not.toContain(secret);
    }
  });
});
