import { CIRCULAR, MAX_DEPTH_MARKER, REDACTED, maskEmail, redactLogOptions } from './redact';

describe('maskEmail', () => {
  it('keeps the first two characters and the domain', () => {
    expect(maskEmail('eusouzf@gmail.com')).toBe('eu***@gmail.com');
  });

  it('returns [redacted] for a malformed address', () => {
    expect(maskEmail('not-an-email')).toBe('[redacted]');
    expect(maskEmail('@gmail.com')).toBe('[redacted]');
    expect(maskEmail('')).toBe('[redacted]');
  });
});

describe('redactLogOptions', () => {
  it('redacts the credential fields exposed by the auth DTOs', () => {
    expect(
      redactLogOptions({
        password: 'hunter2',
        new_password: 'hunter3',
        old_password: 'hunter1',
        token: 'eyJhbGciOi',
        twofa_code: '123456',
        invitation_code: 'INV-abc',
      }),
    ).toEqual({
      password: REDACTED,
      new_password: REDACTED,
      old_password: REDACTED,
      token: REDACTED,
      twofa_code: REDACTED,
      invitation_code: REDACTED,
    });
  });

  it('preserves the code fields that make an error log readable', () => {
    const input = {
      status_code: 401,
      country_code: 'BR',
      language_code: 'pt',
      api_error_code: 'AUTH_001',
      // A bare `code` is an error code here, not a secret — redacting it made error logs useless.
      code: 'ECONNREFUSED',
      decline_code: 'insufficient_funds',
      signal: null,
    };

    expect(redactLogOptions(input)).toEqual(input);
  });

  it('matches keys regardless of case and separators', () => {
    expect(
      redactLogOptions({
        'X-Api-Key': 'k',
        Authorization: 'Bearer x',
        accessToken: 't',
        clientSecret: 's',
      }),
    ).toEqual({
      'X-Api-Key': REDACTED,
      Authorization: REDACTED,
      accessToken: REDACTED,
      clientSecret: REDACTED,
    });
  });

  it('masks email-ish keys instead of dropping them', () => {
    expect(
      redactLogOptions({ email: 'eusouzf@gmail.com', user_email: 'a@b.co', emails: ['xy@y.co'] }),
    ).toEqual({
      email: 'eu***@gmail.com',
      user_email: 'a***@b.co',
      emails: ['xy***@y.co'],
    });
  });

  it('leaves email-ish keys that hold enum/template names alone', () => {
    const input = {
      email_type: 'WAITLIST_UPDATE',
      emailTemplate: 'emails/wait-list/invite',
      email_status: 'skipped',
    };

    expect(redactLogOptions(input)).toEqual(input);
  });

  it('masks only the address-shaped entries of a mixed email list', () => {
    expect(redactLogOptions({ emails: ['xy@y.co', 'BOUNCED'] })).toEqual({
      emails: ['xy***@y.co', 'BOUNCED'],
    });
  });

  it('masks an already-masked email to the same value', () => {
    expect(maskEmail(maskEmail('eusouzf@gmail.com'))).toBe('eu***@gmail.com');
  });

  it('redacts through nested objects and arrays', () => {
    expect(
      redactLogOptions({
        users: [{ name: 'a', password: 'p1' }, { name: 'b', password: 'p2' }],
        nested: { deep: { token: 't' } },
      }),
    ).toEqual({
      users: [{ name: 'a', password: REDACTED }, { name: 'b', password: REDACTED }],
      nested: { deep: { token: REDACTED } },
    });
  });

  it('survives circular references instead of throwing', () => {
    const input: Record<string, unknown> = { password: 'p' };
    input.self = input;

    const result = redactLogOptions(input) as Record<string, unknown>;

    expect(result.password).toBe(REDACTED);
    expect(result.self).toBe(CIRCULAR);
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it('does not mistake repeated sibling references for a cycle', () => {
    const shared = { id: 1 };

    expect(redactLogOptions({ a: shared, b: shared })).toEqual({ a: { id: 1 }, b: { id: 1 } });
  });

  it('caps traversal depth', () => {
    let deep: Record<string, unknown> = { end: true };
    for (let i = 0; i < 12; i++) {
      deep = { nested: deep };
    }

    expect(JSON.stringify(redactLogOptions(deep))).toContain(MAX_DEPTH_MARKER);
  });

  it('truncates long arrays', () => {
    const result = redactLogOptions(Array.from({ length: 150 }, (_, i) => i)) as unknown[];

    expect(result).toHaveLength(101);
    expect(result[100]).toBe('[+50 more]');
  });

  it('passes non-plain values through untouched', () => {
    const date = new Date('2026-08-15T00:00:00Z');
    const buffer = Buffer.from('x');

    const result = redactLogOptions({ date, buffer, count: 3, flag: false, missing: null });

    expect(result).toEqual({ date, buffer, count: 3, flag: false, missing: null });
  });

  it('handles primitives and undefined at the top level', () => {
    expect(redactLogOptions(undefined)).toBeUndefined();
    expect(redactLogOptions(null)).toBeNull();
    expect(redactLogOptions('plain')).toBe('plain');
  });

  it('sanitizes the exact payload that leaked in production', () => {
    const leaked = {
      status_code: 401,
      message: 'Invalid credentials',
      errors: ['Invalid credentials'],
      path: '/api/v1/auth/login',
      requestBody: { email: 'eusouzf@gmail.com', password: 'hunter2' },
      requestParams: {},
      requestQuery: {},
    };

    const serialized = JSON.stringify(redactLogOptions(leaked));

    expect(serialized).not.toContain('hunter2');
    expect(serialized).toContain('"password":"[REDACTED]"');
    expect(serialized).toContain('"email":"eu***@gmail.com"');
    expect(serialized).toContain('"status_code":401');
    expect(serialized).toContain('"path":"/api/v1/auth/login"');
  });
});
