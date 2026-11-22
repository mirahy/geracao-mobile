import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describePeriod, periodToRange } from './period.ts';

const months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05'];

test('últimos N meses usa os meses com dados e deixa o fim aberto', () => {
  assert.deepEqual(periodToRange({ mode: 'last', months: 3 }, months), { from: '2026-03', to: null });
  assert.deepEqual(periodToRange({ mode: 'last', months: 12 }, months), { from: '2026-01', to: null });
});
test('tudo e lista vazia não filtram', () => {
  assert.deepEqual(periodToRange({ mode: 'last', months: 0 }, months), { from: null, to: null });
  assert.deepEqual(periodToRange({ mode: 'last', months: 6 }, []), { from: null, to: null });
});
test('mês específico e período (ordem invertida é corrigida)', () => {
  assert.deepEqual(periodToRange({ mode: 'month', month: '2026-02' }, months), { from: '2026-02', to: '2026-02' });
  assert.deepEqual(periodToRange({ mode: 'range', from: '2026-05', to: '2026-02' }, months), { from: '2026-02', to: '2026-05' });
});
test('descrição', () => {
  const l = (m: string) => `M${m}`;
  assert.equal(describePeriod({ mode: 'last', months: 0 }, l), 'Todo o período');
  assert.equal(describePeriod({ mode: 'range', from: 'a', to: 'b' }, l), 'Ma a Mb');
});
