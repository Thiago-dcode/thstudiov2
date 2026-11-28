import { isArtistRouteSegment, isReservedUsername, normalizeUsername, USERNAME_ROUTE_PATTERN } from '../username';

describe('isReservedUsername (AC-10)', () => {
  it.each([
    ['Atelier', true],
    ['  YouTube ', true],
    ['atelier', true],
    ['constructor', true], // listed on purpose
    ['thsworld', false],
    ['tostring', false],
    ['valueof', false],
    ['toString', false],
    ['__proto__', false],
    ['hasownproperty', false],
    ['', false],
    ['   ', false],
  ])('AC-10: %p -> %p', (name, expected) => {
    expect(isReservedUsername(name)).toBe(expected);
  });

  it('AC-10: uses hasOwn, so prototype keys never match by accident', () => {
    for (const key of ['toString', 'valueOf', '__proto__', 'hasOwnProperty', 'isPrototypeOf']) {
      expect(isReservedUsername(key)).toBe(false);
    }
  });
});

describe('isArtistRouteSegment (AC-7)', () => {
  it.each([
    ['thsworld', true],
    ['THSWORLD', true],
    ['abc', true],
    ['a_b-c', true],
    ['x'.repeat(50), true],
    ['ab', false],
    ['x'.repeat(51), false],
    ['a.b', false],
    ['x_y.z', false],
    ['atelier', false],
    ['Atelier', false],
    ['for', false],
    ['legal', false],
    ['youtube', false],
    ['a11studio', false],
    ['', false],
    ['with space', false],
    ['café', false],
    ['../etc', false],
  ])('AC-7: %p -> %p', (segment, expected) => {
    expect(isArtistRouteSegment(segment)).toBe(expected);
  });

  it('AC-7: the route pattern is wider than the registration rule (stored legacy names)', () => {
    expect(USERNAME_ROUTE_PATTERN.test('old_user-name')).toBe(true);
    expect(USERNAME_ROUTE_PATTERN.test('ab')).toBe(false);
  });
});

describe('normalizeUsername', () => {
  it('trims and lowercases', () => {
    expect(normalizeUsername('  ThsWorld ')).toBe('thsworld');
  });
});
