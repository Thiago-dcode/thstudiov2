import { maskEmailAddresses } from './redact';

/** 64 copies of `ch`, `@`, then 9 near-max labels that end in a digit (never a valid TLD). */
const hostileBlock = (ch: string) =>
  ch.repeat(64) + '@' + ('b'.repeat(62) + '1.').repeat(8) + 'b'.repeat(62) + '1';

describe('maskEmailAddresses', () => {
  it.each([
    ['Invalid to: ross@example.com', 'Invalid to: [email]'],
    ['550 <alice@ssl.example.org> rejected', '550 <[email]> rejected'],
    ['a@b.co and c.d+tag@sub.example.com', '[email] and [email]'],
    ['"quoted@example.com", next', '"[email]", next'],
    ['sss@sss.sss', '[email]'],
  ])('masks %j', (input, expected) => {
    expect(maskEmailAddresses(input)).toBe(expected);
  });

  it('masks addresses inside a multi-line stack', () => {
    const stack = 'Error: bad ross@example.com\n    at send (/app/mail.js:1:1)\n    at user@host.io rejected';
    const masked = maskEmailAddresses(stack);
    expect(masked).not.toMatch(/@example\.com|user@host\.io/);
    expect(masked).toContain('at send (/app/mail.js:1:1)');
  });

  it.each([
    ['a pnpm stack frame', 'at /app/node_modules/.pnpm/stripe@17.7.0/node_modules/stripe/cjs/RequestSender.js:401:41'],
    ['a scoped package frame', 'at async /app/node_modules/@aws-sdk/client-s3/dist-cjs/index.js:12:3'],
    ['a scoped package with version', 'at node_modules/.pnpm/@aws-sdk+client-s3@3.700.0/node_modules/@aws-sdk/client-s3/dist/x.js:1:1'],
    ['a bullmq versioned path', 'at Worker.run (/app/node_modules/.pnpm/bullmq@6.7.1_ioredis@5.4.1/node_modules/bullmq/dist/cjs/classes/worker.js:100:20)'],
    ['an asset name', 'cannot read photo@2x.png'],
    ['a decorator-like token', 'ran @Cron(EVERY_HOUR) handler'],
  ])('keeps %s verbatim (an @ that is not an address)', (_n, text) => {
    expect(maskEmailAddresses(text)).toBe(text);
  });

  it('masks a real address next to a pnpm path in the same message', () => {
    const text = 'Invalid to: ross@example.com at /app/node_modules/.pnpm/stripe@17.7.0/node_modules/stripe/x.js:1:1';
    expect(maskEmailAddresses(text)).toBe(
      'Invalid to: [email] at /app/node_modules/.pnpm/stripe@17.7.0/node_modules/stripe/x.js:1:1',
    );
  });

  it.each([
    ['ross@example.com', '[email]'],
    ['<sam.s@mail.co.uk>', '<[email]>'],
    ['to: first.last+tag@sub.domain.io;', 'to: [email];'],
    ['(alice@ssl.example.org)', '([email])'],
  ])('still masks the address in %j', (input, expected) => {
    expect(maskEmailAddresses(input)).toBe(expected);
  });

  it('leaves text without an address untouched', () => {
    expect(maskEmailAddresses('connection reset at 10:20')).toBe('connection reset at 10:20');
    expect(maskEmailAddresses('')).toBe('');
  });

  it('passes non-strings through unchanged', () => {
    expect(maskEmailAddresses(undefined as any)).toBeUndefined();
    expect(maskEmailAddresses(null as any)).toBeNull();
    expect(maskEmailAddresses(5 as any)).toBe(5);
  });

  it('is idempotent', () => {
    const once = maskEmailAddresses('x ross@example.com y');
    expect(maskEmailAddresses(once)).toBe(once);
  });

  // Round-3 review: the tighter pattern let these real addresses through unmasked.
  it.each([
    ['Invalid to: wang@163.com', 'Invalid to: [email]'],
    ['li@126.com', '[email]'],
    ['kurt@1und1.de', '[email]'],
    ['jose@münchen.de', '[email]'],
    ['user@example.xn--p1ai', '[email]'],
    ['ROSS@EXAMPLE.COM', '[email]'],
    ['USER@EXAMPLE.XN--P1AI', '[email]'],
    ['jose@münchen.de', '[email]'],
    ['user@पंजाब.भारत', '[email]'],
    ['用户@例子.广告', '[email]'],
    ['ross@example.map', '[email]'],
    ['x ross@example.com', 'x [email]'],
    ['ross@example.com. Next', '[email]. Next'],
  ])('masks digit-leading, Unicode and punycode domains: %j', (input, expected) => {
    expect(maskEmailAddresses(input)).toBe(expected);
  });

  // Round-5 review: a lookbehind anchor on the local part leaked these.
  it.each([
    [
      'utm_source=newsletter&utm_medium=email&utm_campaign=launch_2026&email=ross@example.com',
      'ross@example.com',
    ],
    ['to=a@x.com&cc=b@y.com', 'b@y.com'],
    ['ross@example.com|sam@example.org', 'sam@example.org'],
    ['ross@example.com+sam@example.org', 'sam@example.org'],
    ['x'.repeat(65) + 'ross@example.com', 'ross@example.com'],
    ['mailto:ross@example.com', 'ross@example.com'],
    ['To:ross@example.com', 'ross@example.com'],
  ])('masks an address that is not after a delimiter: %j', (input, address) => {
    const masked = maskEmailAddresses(input);
    expect(masked).not.toContain(address);
    expect(masked).not.toContain(address.split('@')[1]);
    expect(masked).toContain('[email]');
  });

  it('masks only the last 64 characters of an over-long local part', () => {
    expect(maskEmailAddresses('x'.repeat(65) + 'ross@example.com')).toBe('x'.repeat(5) + '[email]');
  });

  it('masks every address in a list', () => {
    expect(maskEmailAddresses('to=a@x.com&cc=b@y.com&bcc=c@z.org')).not.toMatch(/@/);
  });

  it.each(['🙂ross@example.com', '例ross@example.com'])(
    'treats an astral or CJK char before the address as part of the local part: %j',
    (input) => {
      expect(maskEmailAddresses(input)).toBe('[email]');
    },
  );

  it('never splits a surrogate pair at the 64-char cap', () => {
    const masked = maskEmailAddresses('😀'.repeat(70) + '@example.com');
    expect(masked).toBe('😀'.repeat(6) + '[email]');
    expect(masked).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/);
  });

  it.each([
    ['[ross@example.com]', '[[email]]'],
    ['`ross@example.com`', '`[email]`'],
    ['(ross@example.com).', '([email]).'],
    ['{ross@example.com}', '{[email]}'],
  ])('keeps the delimiter around a masked address: %j', (input, expected) => {
    expect(maskEmailAddresses(input)).toBe(expected);
  });

  it.each([
    'logo@3x.webp',
    'icon@2x.svg',
    'icon@2x.PNG',
    'photo@2x.JPG',
    'photo@2x.min.png',
    'user@localhost',
    'x@1.2.3',
    'pkg@1.0.0/file.js',
    '@sentry/node@7.120.0',
    'see <@example.com>',
    'a@@example.com',
  ])('leaves %j untouched', (input) => {
    expect(maskEmailAddresses(input)).toBe(input);
  });

  // Round-3 review: an uncapped pattern blocked the event loop ~4 s on a 99 KB request body value.
  it.each([
    ['a long run with no @', 'a'.repeat(100_000)],
    ['repeated "a@"', 'a@'.repeat(50_000)],
    ['a long hyphenated domain', 'x@' + 'a-'.repeat(50_000)],
    ['many numeric labels', 'a@' + '1.'.repeat(50_000) + '1'],
    ['many near-addresses', ('a'.repeat(60) + '@' + 'b.'.repeat(20)).repeat(1_500)],
    // Round-4 review: non-ASCII local parts cost ~400 ms before the local part was anchored.
    ['emoji near-addresses', hostileBlock('😀').repeat(142)],
    ['CJK near-addresses', hostileBlock('例').repeat(157)],
    ['ASCII near-addresses', hostileBlock('a').repeat(150)],
  ])('masks 100 KB of hostile input (%s) quickly', (_label, input) => {
    const started = performance.now();
    maskEmailAddresses(input);
    expect(performance.now() - started).toBeLessThan(250);
  });
});
