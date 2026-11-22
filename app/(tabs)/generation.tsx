import * as DocumentPicker from 'expo-document-picker';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '../../src/api/client';
import { UnitFilter } from '../../src/components/Filters';
import { PeriodFilter } from '../../src/components/PeriodFilter';
import { Button, Card, Field, State, Title, confirmDestructive, errorMessage } from '../../src/components/ui';
import { fmtKwh, monthLabel, parseDecimal } from '../../src/lib/format';
import { useAuth } from '../../src/lib/auth';
import { filePart } from '../../src/lib/upload';
import { useAsync } from '../../src/lib/useAsync';
import { usePeriod } from '../../src/lib/usePeriod';
import { useTheme } from '../../src/theme';

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function Generation() {
  const t = useTheme();
  const router = useRouter();
  const { api, can } = useAuth();
  const [importing, setImporting] = useState(false);
  const { period, setPeriod, months, range, ready } = usePeriod();
  const [unitId, setUnitId] = useState<number | null>(null);
  const [month, setMonth] = useState(currentMonth());
  const [kwh, setKwh] = useState('');
  const [saving, setSaving] = useState(false);
  const units = useAsync(() => api.units(), [api]);
  const list = useAsync(() => api.generations(unitId, range), [api, unitId, range.from, range.to, ready]);
  const pending = useAsync(() => api.pendingGenerations(), [api]);
  useFocusEffect(useCallback(() => { void pending.reload(); void list.reload(); }, [pending.reload, list.reload]));
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

  const importSheet = async () => {
    if (target == null) {
      Alert.alert('Importar planilha', 'Nenhuma unidade geradora disponível para edição.');
      return;
    }
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '*/*'], copyToCacheDirectory: true });
    if (res.canceled || !res.assets[0]) return;
    const f = res.assets[0];
    const form = new FormData();
    form.append('file', filePart(f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));
    form.append('consumer_unit_id', String(target));
    setImporting(true);
    try {
      const { data } = await api.importSpreadsheet(form);
      const name = generators.find((g) => g.id === target)?.name ?? 'UC';
      Alert.alert('Planilha importada', [`${name}: ${data.days} dia(s) importado(s).`, data.updated ? `${data.updated} mês(es) gravado(s) pelo período da fatura.` : null,
        data.pending.length ? `${data.pending.length} período(s) aguardam sua decisão.` : null,
        !data.updated && !data.pending.length ? 'Nenhum mês fechado: importe as faturas da unidade geradora cujo período esteja coberto pela planilha.' : null].filter(Boolean).join('\n'));
      await Promise.all([list.reload(), pending.reload()]);
      if (data.pending.length) router.push('/generation/review');
    } catch (e) {
      Alert.alert('Não foi possível importar', errorMessage(e));
    } finally {
      setImporting(false);
    }
  };

  const remove = (id: number, label: string) =>
    confirmDestructive('Excluir geração', `${label}?`, async () => {
      try { await api.deleteGeneration(id); await list.reload(); }
      catch (e) { Alert.alert('Não foi possível excluir', errorMessage(e)); }
    });

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
            <PeriodFilter value={period} onChange={setPeriod} months={months} />
            {can('geracao.editar') ? (
              <View style={{ gap: 8 }}>
                <Button title="Importar planilha diária (.xlsx)" onPress={importSheet} loading={importing} />
                {(pending.data?.data.length ?? 0) > 0 ? (
                  <Button title={`Revisar importação (${pending.data?.data.length})`} variant="ghost" onPress={() => router.push('/generation/review')} />
                ) : null}
              </View>
            ) : null}
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
          <Pressable onLongPress={can('geracao.editar') ? () => remove(item.id, `${monthLabel(item.reference_month)} · ${item.unit_name}`) : undefined}>
            <Card style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: t.text, fontWeight: '700' }}>{monthLabel(item.reference_month)}</Text>
                <Text style={{ color: t.muted, fontSize: 12 }}>{item.unit_name} · {item.source === 'manual' ? 'manual' : 'planilha'}{can('geracao.editar') ? ' · segure para excluir' : ''}</Text>
              </View>
              <Text style={{ color: t.text, fontWeight: '700' }}>{fmtKwh(item.generated_kwh)}</Text>
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
