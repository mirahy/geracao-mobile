import type { ActivityEntry } from '../api/types';

export type PeriodPreset = 'today' | '7d' | '30d' | 'all';

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'all', label: 'Tudo' },
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Data inicial (Y-m-d, no fuso local) do período escolhido; null = sem limite. */
export function presetFrom(preset: PeriodPreset, now: Date = new Date()): string | null {
  if (preset === 'all') return null;
  const days = preset === 'today' ? 0 : preset === '7d' ? 6 : 29;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "2026-03-15T14:05:09-04:00" => "15/03/2026 14:05" (no fuso do aparelho). */
export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const show = (v: unknown): string => (v === null || v === undefined || v === '' ? '—' : typeof v === 'boolean' ? (v ? 'sim' : 'não') : String(v));

/** "campo: antes → depois" para cada campo alterado (limitado a `max` linhas). */
export function describeChanges(entry: Pick<ActivityEntry, 'changes'>, max = 6): string[] {
  const lines = Object.entries(entry.changes).map(([field, [before, after]]) => `${field}: ${show(before)} → ${show(after)}`);
  return lines.length > max ? [...lines.slice(0, max), `… e mais ${lines.length - max} campo(s)`] : lines;
}

export const TYPE_LABEL = { access: 'Acesso', view: 'Visualização', change: 'Alteração' } as const;
export const CHANNEL_LABEL = { api: 'App', panel: 'Painel', console: 'Sistema' } as const;
