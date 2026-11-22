export type TabName = 'index' | 'units' | 'generation' | 'invoices' | 'rateio';

/** Abas visíveis conforme as permissões; Geração também exige alcançar alguma unidade geradora. */
export function visibleTabs(can: (permission: string) => boolean, hasGenerator: boolean): TabName[] {
  const rules: [TabName, boolean][] = [
    ['index', can('painel.ver')],
    ['units', can('unidades.ver')],
    ['generation', can('geracao.ver') && hasGenerator],
    ['invoices', can('faturas.ver')],
    ['rateio', can('pagamentos.ver')],
  ];
  return rules.filter(([, ok]) => ok).map(([name]) => name);
}

export interface AdminSection {
  key: string;
  permission: string;
  generatorOnly?: boolean;
}

/** Seções de administração visíveis; "Parcelas" só para quem alcança uma unidade geradora. */
export function visibleAdminSections<T extends AdminSection>(sections: T[], can: (permission: string) => boolean, hasGenerator: boolean): T[] {
  return sections.filter((s) => can(s.permission) && (!s.generatorOnly || hasGenerator));
}
