import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visibleAdminSections, visibleTabs } from './access.ts';

const has = (...perms: string[]) => (p: string) => perms.includes(p);

test('abas seguem as permissões', () => {
  assert.deepEqual(visibleTabs(has('painel.ver', 'faturas.ver'), true), ['index', 'invoices']);
  assert.deepEqual(visibleTabs(has(), true), []);
});
test('geração exige unidade geradora', () => {
  assert.deepEqual(visibleTabs(has('geracao.ver'), false), []);
  assert.deepEqual(visibleTabs(has('geracao.ver'), true), ['generation']);
});
test('seções de administração', () => {
  const sections = [{ key: 'a', permission: 'usuarios.gerenciar' }, { key: 'p', permission: 'parcelas.ver', generatorOnly: true }];
  assert.deepEqual(visibleAdminSections(sections, has('usuarios.gerenciar', 'parcelas.ver'), false).map((s) => s.key), ['a']);
  assert.deepEqual(visibleAdminSections(sections, has('parcelas.ver'), true).map((s) => s.key), ['p']);
});
