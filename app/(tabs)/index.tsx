import React, { useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip, State } from '../../src/components/ui';
import { DashboardView } from '../../src/components/DashboardView';
import { UnitFilter } from '../../src/components/Filters';
import { useAuth } from '../../src/lib/auth';
import { useAsync } from '../../src/lib/useAsync';
import { useTheme } from '../../src/theme';

const RANGES = [{ label: '6 meses', n: 6 }, { label: '12 meses', n: 12 }, { label: 'Tudo', n: 0 }];

export default function Painel() {
  const t = useTheme();
  const { api } = useAuth();
  const [unitId, setUnitId] = useState<number | null>(null);
  const [range, setRange] = useState(12);
  const units = useAsync(() => api.units(), [api]);
  const months = useAsync(() => api.months(), [api]);
  const keys = months.data?.data.map((m) => m.key) ?? [];
  const from = range && keys.length ? keys[Math.max(keys.length - range, 0)] : null;
  const dash = useAsync(() => api.dashboard({ unit_id: unitId, from }), [api, unitId, from, months.data]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} refreshControl={<RefreshControl refreshing={dash.loading} onRefresh={dash.reload} />}>
        <UnitFilter units={units.data?.data ?? []} value={unitId} onChange={setUnitId} />
        <ScrollView horizontal style={{ flexGrow: 0 }}>
          {RANGES.map((r) => <Chip key={r.n} label={r.label} active={range === r.n} onPress={() => setRange(r.n)} />)}
        </ScrollView>
        <State loading={dash.loading && !dash.data} error={dash.error} onRetry={dash.reload} />
        {dash.data ? <DashboardView data={dash.data} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
