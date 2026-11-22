import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeFilePart } from './filePart.ts';

test('a parte tem nome, tipo e bytes() — o que o fetch do Expo exige', async () => {
  const part = makeFilePart('IMG-1.jpg', 'image/jpeg', async () => new Uint8Array([1, 2, 3]));
  assert.equal(part.name, 'IMG-1.jpg');
  assert.equal(part.type, 'image/jpeg');
  assert.deepEqual([...(await part.bytes())], [1, 2, 3]);
  assert.ok('bytes' in part, 'o conversor do Expo reconhece a parte pela presença de bytes()');
});

test('sem tipo conhecido o cabeçalho content-type é omitido', () => {
  const part = makeFilePart('a.xlsx', null, async () => new Uint8Array());
  assert.equal('type' in part, false);
});

test('não usa o formato antigo { uri }', () => {
  const part = makeFilePart('a.pdf', 'application/pdf', async () => new Uint8Array());
  assert.equal('uri' in part, false);
});
