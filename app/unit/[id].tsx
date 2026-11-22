import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { DashboardView } from '../../src/components/DashboardView';
import { PeriodFilter } from '../../src/components/PeriodFilter';
import { State } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { useAsync } from '../../src/lib/useAsync';
import { usePeriod } from '../../src/lib/usePeriod';
import { useTheme } from '../../src/theme';

export default function UnitDetail() {
  const t = useTheme();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { api } = useAuth();
  const { period, setPeriod, months, range, ready } = usePeriod();
  const dash = useAsync(() => api.dashboard({ unit_id: Number(id), from: range.from, to: range.to }), [api, id, range.from, range.to, ready]);
  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, gap: 12 }} refreshControl={<RefreshControl refreshing={dash.loading} onRefresh={dash.reload} />}>
      <Stack.Screen options={{ title: name ?? 'Unidade' }} />
      <PeriodFilter value={period} onChange={setPeriod} months={months} />
      <State loading={dash.loading && !dash.data} error={dash.error} onRetry={dash.reload} />
      {dash.data ? <DashboardView data={dash.data} /> : null}
    </ScrollView>
  );
}
