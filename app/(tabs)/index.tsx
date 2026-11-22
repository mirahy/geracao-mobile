import { Redirect, type Href } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { State } from '../../src/components/ui';
import { DashboardView } from '../../src/components/DashboardView';
import { UnitFilter } from '../../src/components/Filters';
import { PeriodFilter } from '../../src/components/PeriodFilter';
import { visibleTabs } from '../../src/lib/access';
import { useAuth } from '../../src/lib/auth';
import { useAsync } from '../../src/lib/useAsync';
import { usePeriod } from '../../src/lib/usePeriod';
import { useTheme } from '../../src/theme';

const TAB_HREF: Record<string, Href> = { units: '/units', generation: '/generation', invoices: '/invoices', rateio: '/rateio' };

export default function Painel() {
  const { can, hasGenerator } = useAuth();
  if (!can('painel.ver')) {
    const first = visibleTabs(can, hasGenerator).find((n) => n !== 'index');
    return <Redirect href={first ? TAB_HREF[first] : '/account'} />;
  }
  return <PainelContent />;
}

function PainelContent() {
  const t = useTheme();
  const { api } = useAuth();
  const [unitId, setUnitId] = useState<number | null>(null);
  const { period, setPeriod, months, range, ready } = usePeriod();
  const units = useAsync(() => api.units(), [api]);
  const dash = useAsync(() => api.dashboard({ unit_id: unitId, from: range.from, to: range.to }), [api, unitId, range.from, range.to, ready]);

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} refreshControl={<RefreshControl refreshing={dash.loading} onRefresh={dash.reload} />}>
        <UnitFilter units={units.data?.data ?? []} value={unitId} onChange={setUnitId} />
        <PeriodFilter value={period} onChange={setPeriod} months={months} />
        <State loading={dash.loading && !dash.data} error={dash.error} onRetry={dash.reload} />
        {dash.data ? <DashboardView data={dash.data} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
