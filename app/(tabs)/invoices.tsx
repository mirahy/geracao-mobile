import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UnitFilter } from '../../src/components/Filters';
import { Card, State } from '../../src/components/ui';
import { fmtBrl, fmtDate, fmtKwh, monthLabel } from '../../src/lib/format';
import { useAuth } from '../../src/lib/auth';
import { useAsync } from '../../src/lib/useAsync';
import { useTheme } from '../../src/theme';

export default function Invoices() {
  const t = useTheme();
  const { api } = useAuth();
  const [unitId, setUnitId] = useState<number | null>(null);
  const units = useAsync(() => api.units(), [api]);
  const list = useAsync(() => api.invoices(unitId), [api, unitId]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 12 }}
        data={list.data?.data ?? []}
        keyExtractor={(i) => String(i.id)}
        refreshing={list.loading}
        onRefresh={list.reload}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <UnitFilter units={units.data?.data ?? []} value={unitId} onChange={setUnitId} />
            <State loading={list.loading && !list.data} error={list.error} onRetry={list.reload} />
          </View>
        }
        renderItem={({ item }) => (
          <Card style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: t.text, fontWeight: '700' }}>{monthLabel(item.reference_month)} · {item.unit_name}</Text>
              <Text style={{ color: t.text, fontWeight: '700' }}>{fmtBrl(item.total_amount)}</Text>
            </View>
            <Text style={{ color: t.muted }}>Vence {fmtDate(item.due_date)} · {item.paid_at ? `pago em ${fmtDate(item.paid_at)}` : 'em aberto'}</Text>
            <Text style={{ color: t.text }}>Consumo {fmtKwh(item.consumption_kwh)} · Compensado {fmtKwh(item.compensated_kwh)}</Text>
            <Text style={{ color: t.good }}>Economia {fmtBrl(item.savings)} · Saldo {fmtKwh(item.credit_balance_kwh)}</Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
