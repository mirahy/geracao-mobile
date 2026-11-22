import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmtDate, monthLabel, parseDecimal } from './format.ts';

test('monthLabel', () => {
  assert.equal(monthLabel('2026-03-01'), 'Mar/26');
  assert.equal(monthLabel('2026-12'), 'Dez/26');
});
test('fmtDate', () => {
  assert.equal(fmtDate('2026-03-15'), '15/03/2026');
  assert.equal(fmtDate(null), '—');
});
test('parseDecimal', () => {
  assert.equal(parseDecimal('1.234,56'), 1234.56);
  assert.equal(parseDecimal('1234.5'), 1234.5);
  assert.equal(parseDecimal(''), null);
  assert.equal(parseDecimal('abc'), null);
});
