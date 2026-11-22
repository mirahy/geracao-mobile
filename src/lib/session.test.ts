import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isExpired } from './session.ts';

test('token sem expiração nunca vence', () => assert.equal(isExpired({ expiresAt: null }), false));
test('token vencido e válido', () => {
  const now = Date.parse('2026-06-01T00:00:00Z');
  assert.equal(isExpired({ expiresAt: '2026-01-01T00:00:00Z' }, now), true);
  assert.equal(isExpired({ expiresAt: '2027-01-01T00:00:00Z' }, now), false);
});
