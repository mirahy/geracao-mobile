import React, { useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '../../src/api/client';
import { UnitFilter } from '../../src/components/Filters';
import { Button, Card, Field, State, Title } from '../../src/components/ui';
import { fmtKwh, monthLabel, parseDecimal } from '../../src/lib/format';
import { useAuth } from '../../src/lib/auth';
import { useAsync } from '../../src/lib/useAsync';
import { useTheme } from '../../src/theme';

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function Generation() {
  const t = useTheme();
  const { api, can } = useAuth();
  const [unitId, setUnitId] = useState<number | null>(null);
  const [month, setMonth] = useState(currentMonth());
  const [kwh, setKwh] = useState('');
  const [saving, setSaving] = useState(false);
  const units = useAsync(() => api.units(), [api]);
  const list = useAsync(() => api.generations(unitId), [api, unitId]);
  const generators = (units.data?.data ?? []).filter((u) => u.role === 'generator');
  const target = unitId ?? generators[0]?.id ?? null;

  const save = async () => {
    const value = parseDecimal(kwh);
    if (target == null || value == null || value < 0 || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      Alert.alert('Dados inválidos', 'Informe a UC, o mês (AAAA-MM) e o total de kWh gerados.');
      return;
    }
    setSaving(true);
    try {
      await api.saveGeneration({ consumer_unit_id: target, reference_month: `${month}-01`, generated_kwh: value });
      setKwh('');
      await list.reload();
    } catch (e) {
      Alert.alert('Não foi possível salvar', e instanceof ApiError ? e.message : 'Erro inesperado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 12 }}
        data={list.data?.data ?? []}
        keyExtractor={(g) => String(g.id)}
        refreshing={list.loading}
        onRefresh={list.reload}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <UnitFilter units={generators} value={unitId} onChange={setUnitId} />
            {can('geracao.editar') ? (
              <Card style={{ gap: 10 }}>
                <Title>Informar geração do mês</Title>
                <Field label="Mês (AAAA-MM)" value={month} onChangeText={setMonth} autoCapitalize="none" />
                <Field label="Total gerado (kWh)" value={kwh} onChangeText={setKwh} keyboardType="decimal-pad" placeholder="ex.: 1.234,5" />
                <Button title="Salvar" onPress={save} loading={saving} />
              </Card>
            ) : null}
            <State loading={list.loading && !list.data} error={list.error} onRetry={list.reload} />
          </View>
        }
        renderItem={({ item }) => (
          <Card style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: t.text, fontWeight: '700' }}>{monthLabel(item.reference_month)}</Text>
              <Text style={{ color: t.muted, fontSize: 12 }}>{item.unit_name} · {item.source === 'manual' ? 'manual' : 'planilha'}</Text>
            </View>
            <Text style={{ color: t.text, fontWeight: '700' }}>{fmtKwh(item.generated_kwh)}</Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
