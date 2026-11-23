import { describe, expect, it } from 'vitest';
import { isBlockedLoadNoise } from '../truth/fixtures.ts';

// R17: the guard drops only Chrome's own "Failed to load resource" line for a request it blocked.
describe('isBlockedLoadNoise', () => {
  const page = 'https://product.example.com/checkout';
  const blocked = new Set([page, 'https://product.example.com/api/beacon']);

  it("drops Chrome's load failure for a request the guard blocked", () => {
    expect(isBlockedLoadNoise('Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector', page, blocked)).toBe(true);
  });

  it('keeps an app error whose location is a blocked URL (a page that POSTs to itself)', () => {
    expect(isBlockedLoadNoise("TypeError: Cannot read properties of undefined (reading 'id')", page, blocked)).toBe(false);
    expect(isBlockedLoadNoise('Error: Failed to load resource list', page, blocked)).toBe(false);
  });

  it('keeps a load failure for a URL the guard did not block', () => {
    expect(
      isBlockedLoadNoise(
        'Failed to load resource: the server responded with a status of 404 ()',
        'https://product.example.com/missing.png',
        blocked,
      ),
    ).toBe(false);
  });

  it('keeps an error with no location', () => {
    expect(isBlockedLoadNoise('Failed to load resource: net::ERR_BLOCKED_BY_CLIENT', '', blocked)).toBe(false);
  });
});
