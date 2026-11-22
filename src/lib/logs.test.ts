import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeChanges, fmtDateTime, presetFrom } from './logs.ts';

test('presetFrom conta a partir de hoje no fuso local', () => {
  const now = new Date(2026, 10, 22, 15, 0, 0); // 22/11/2026
  assert.equal(presetFrom('today', now), '2026-11-22');
  assert.equal(presetFrom('7d', now), '2026-11-16');
  assert.equal(presetFrom('30d', now), '2026-10-24');
  assert.equal(presetFrom('all', now), null);
});

test('fmtDateTime formata data e hora locais', () => {
  const d = new Date(2026, 2, 5, 9, 7);
  assert.equal(fmtDateTime(d.toISOString()), '05/03/2026 09:07');
  assert.equal(fmtDateTime('inválida'), 'inválida');
});

test('describeChanges mostra antes → depois e limita as linhas', () => {
  assert.deepEqual(describeChanges({ changes: { name: ['A', 'B'], active: [true, false], city: [null, 'Naviraí'] } }), [
    'name: A → B', 'active: sim → não', 'city: — → Naviraí',
  ]);
  const many = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`f${i}`, [i, i + 1]])) as Record<string, [unknown, unknown]>;
  const lines = describeChanges({ changes: many }, 6);
  assert.equal(lines.length, 7);
  assert.equal(lines[6], '… e mais 2 campo(s)');
});
