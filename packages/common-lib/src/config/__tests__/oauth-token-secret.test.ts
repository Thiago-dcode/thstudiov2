import { config } from '../index';

describe('config oauth.tokenSecret', () => {
  const original = process.env.OAUTH_TOKEN_SECRET;
  const missingEnvFile = '/nonexistent/path/.env';

  afterEach(() => {
    if (original === undefined) delete process.env.OAUTH_TOKEN_SECRET;
    else process.env.OAUTH_TOKEN_SECRET = original;
  });

  it('AC-13: config() does not throw when OAUTH_TOKEN_SECRET is unset, only reading the secret does', () => {
    delete process.env.OAUTH_TOKEN_SECRET;
    expect(() => config(missingEnvFile)).not.toThrow();
    expect(() => config(missingEnvFile).oauth.tokenSecret).toThrow(/OAUTH_TOKEN_SECRET/);
  });

  it('AC-13: a blank value is rejected', () => {
    process.env.OAUTH_TOKEN_SECRET = '   ';
    expect(() => config(missingEnvFile).oauth.tokenSecret).toThrow(/OAUTH_TOKEN_SECRET/);
  });

  it('AC-13: returns the value when set', () => {
    process.env.OAUTH_TOKEN_SECRET = 'x'.repeat(40);
    expect(config(missingEnvFile).oauth.tokenSecret).toBe('x'.repeat(40));
  });
});
