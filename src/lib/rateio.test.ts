import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STATUS_LABEL, statusTone } from './rateio.ts';

test('status do rateio', () => {
  assert.equal(STATUS_LABEL.partial, 'Parcial');
  assert.equal(statusTone('pending'), 'bad');
  assert.equal(statusTone('paid'), 'good');
  assert.equal(statusTone('without_charge'), 'muted');
});
