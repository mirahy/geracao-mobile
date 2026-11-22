const nf = (digits: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtKwh = (v: number | null | undefined): string => (v == null ? '—' : `${nf(0).format(v)} kWh`);
export const fmtBrl = (v: number | null | undefined): string =>
  v == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
export const fmtNumber = (v: number | null | undefined, digits = 0): string => (v == null ? '—' : nf(digits).format(v));

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** "2026-03-01" ou "2026-03" => "Mar/26" */
export function monthLabel(value: string): string {
  const [y, m] = value.split('-');
  return `${MONTHS[Number(m) - 1] ?? m}/${y.slice(2)}`;
}

/** "2026-03-15" => "15/03/2026" */
export function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  const [y, m, d] = value.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** Aceita "1.234,56" ou "1234.56". */
export function parseDecimal(input: string): number | null {
  const s = input.trim();
  if (!s) return null;
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}
