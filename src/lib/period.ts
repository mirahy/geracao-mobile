export type Period =
  | { mode: 'last'; months: number } // months = 0 => tudo
  | { mode: 'month'; month: string }
  | { mode: 'range'; from: string; to: string };

export interface Range {
  from: string | null;
  to: string | null;
}

export const DEFAULT_PERIOD: Period = { mode: 'last', months: 12 };

/** Converte o período escolhido em from/to ("Y-m") para a API, a partir dos meses com dados (ordenados). */
export function periodToRange(period: Period, availableMonths: string[]): Range {
  switch (period.mode) {
    case 'last':
      if (!period.months || !availableMonths.length) return { from: null, to: null };
      return { from: availableMonths[Math.max(availableMonths.length - period.months, 0)], to: null };
    case 'month':
      return { from: period.month, to: period.month };
    case 'range': {
      const [from, to] = period.from <= period.to ? [period.from, period.to] : [period.to, period.from];
      return { from, to };
    }
  }
}

export function describePeriod(period: Period, label: (month: string) => string): string {
  switch (period.mode) {
    case 'last':
      return period.months ? `Últimos ${period.months} meses` : 'Todo o período';
    case 'month':
      return label(period.month);
    case 'range':
      return `${label(period.from)} a ${label(period.to)}`;
  }
}
