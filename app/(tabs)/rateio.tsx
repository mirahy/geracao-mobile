import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RateioPayment, RateioRow } from '../../src/api/types';
import { Button, Card, Chip, State } from '../../src/components/ui';
import { UnitFilter } from '../../src/components/Filters';
import { fmtBrl, fmtDate, monthLabel } from '../../src/lib/format';
import { STATUS_LABEL, statusTone } from '../../src/lib/rateio';
import { useAuth } from '../../src/lib/auth';
import { useAsync } from '../../src/lib/useAsync';
import { useTheme } from '../../src/theme';

export default function Rateio() {
  const t = useTheme();
  const router = useRouter();
  const { api, can } = useAuth();
  const [unitId, setUnitId] = useState<number | null>(null);
  const [view, setView] = useState<'summary' | 'payments'>('summary');
  const units = useAsync(() => api.units(), [api]);
  const summary = useAsync(() => api.rateioSummary(unitId), [api, unitId]);
  const payments = useAsync(() => api.rateioPayments(unitId), [api, unitId]);
  const receivers = (units.data?.data ?? []).filter((u) => u.role === 'receiver');

  useFocusEffect(useCallback(() => { void summary.reload(); void payments.reload(); }, [summary.reload, payments.reload]));

  const remove = (p: RateioPayment) =>
    Alert.alert('Excluir pagamento', `${fmtBrl(p.amount)} de ${p.unit_name ?? 'UC'} (${monthLabel(p.reference_month)})?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try { await api.deleteRateioPayment(p.id); await Promise.all([summary.reload(), payments.reload()]); }
          catch (e) { Alert.alert('Não foi possível excluir', e instanceof Error ? e.message : 'Erro inesperado'); }
        },
      },
    ]);

  const tone = (s: RateioRow['status']) => { const k = statusTone(s); return k === 'muted' ? t.muted : t[k]; };
  const active = view === 'summary' ? summary : payments;

  const header = (
    <View style={{ gap: 12 }}>
      <UnitFilter units={receivers} value={unitId} onChange={setUnitId} />
      <ScrollView horizontal style={{ flexGrow: 0 }}>
        <Chip label="Situação por mês" active={view === 'summary'} onPress={() => setView('summary')} />
        <Chip label="Pagamentos" active={view === 'payments'} onPress={() => setView('payments')} />
      </ScrollView>
      {can('pagamentos.editar') ? <Button title="Lançar pagamento" onPress={() => router.push('/rateio/new')} /> : null}
      <State loading={active.loading && !active.data} error={active.error} onRetry={active.reload} />
    </View>
  );

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: t.bg }}>
      {view === 'summary' ? (
        <FlatList
          contentContainerStyle={{ padding: 16, gap: 12 }}
          data={summary.data?.data ?? []}
          keyExtractor={(r) => `${r.unit_id}-${r.month}`}
          refreshing={summary.loading}
          onRefresh={summary.reload}
          ListHeaderComponent={header}
          renderItem={({ item }) => (
            <Card style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: t.text, fontWeight: '700' }}>{monthLabel(item.month)} · {item.unit}</Text>
                <Text style={{ color: tone(item.status), fontWeight: '700' }}>{STATUS_LABEL[item.status]}</Text>
              </View>
              <Text style={{ color: t.text }}>Devido {fmtBrl(item.due)} · Pago {fmtBrl(item.paid)}</Text>
              <Text style={{ color: item.balance > 0.004 ? t.bad : t.muted }}>Saldo {fmtBrl(item.balance)} · {item.payments} lançamento(s)</Text>
            </Card>
          )}
        />
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16, gap: 12 }}
          data={payments.data?.data ?? []}
          keyExtractor={(p) => String(p.id)}
          refreshing={payments.loading}
          onRefresh={payments.reload}
          ListHeaderComponent={header}
          renderItem={({ item }) => (
            <Pressable onLongPress={can('pagamentos.editar') ? () => remove(item) : undefined}>
              <Card style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: t.text, fontWeight: '700' }}>{monthLabel(item.reference_month)} · {item.unit_name}</Text>
                  <Text style={{ color: t.text, fontWeight: '700' }}>{fmtBrl(item.amount)}</Text>
                </View>
                <Text style={{ color: t.muted }}>Pago em {fmtDate(item.paid_at)}{item.payer_name ? ` · ${item.payer_name}` : ''}</Text>
                <Text style={{ color: t.muted, fontSize: 12 }}>
                  {item.source === 'comprovante' ? 'via comprovante' : 'lançamento manual'}{item.has_receipt ? ' · com comprovante' : ''}{can('pagamentos.editar') ? ' · segure para excluir' : ''}
                </Text>
              </Card>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
