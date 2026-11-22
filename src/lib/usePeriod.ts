import { useMemo, useState } from 'react';
import { useAuth } from './auth';
import { DEFAULT_PERIOD, periodToRange, type Period } from './period';
import { useAsync } from './useAsync';

/** Estado do filtro de período + meses com dados + intervalo from/to pronto para a API. */
export function usePeriod(initial: Period = DEFAULT_PERIOD) {
  const { api } = useAuth();
  const [period, setPeriod] = useState<Period>(initial);
  const monthsReq = useAsync(() => api.months(), [api]);
  const months = useMemo(() => monthsReq.data?.data.map((m) => m.key) ?? [], [monthsReq.data]);
  const range = useMemo(() => periodToRange(period, months), [period, months]);
  return { period, setPeriod, months, range, ready: !monthsReq.loading };
}
