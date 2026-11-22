import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Button, Card, Field, OptionChips, State, confirmDestructive, errorMessage } from '../../../src/components/ui';
import { parseDecimal } from '../../../src/lib/format';
import { useAuth } from '../../../src/lib/auth';
import { useAsync } from '../../../src/lib/useAsync';
import { useTheme } from '../../../src/theme';

const validMonth = (v: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(v);

export default function InstallmentForm() {
  const t = useTheme();
  const router = useRouter();
  const { api, can } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const editable = can('parcelas.editar');
  const units = useAsync(() => api.units(), [api]);
  const list = useAsync(() => api.installments(), [api]);
  const generators = (units.data?.data ?? []).filter((u) => u.role === 'generator');
  const existing = list.data?.data.find((i) => String(i.id) === id);

  const [unitId, setUnitId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setUnitId(existing.consumer_unit_id); setAmount(String(existing.amount).replace('.', ','));
    setStart(existing.start_month.slice(0, 7)); setEnd(existing.end_month?.slice(0, 7) ?? ''); setDescription(existing.description ?? '');
  }, [existing]);
  useEffect(() => { if (isNew && unitId == null && generators[0]) setUnitId(generators[0].id); }, [isNew, unitId, generators]);

  const save = async () => {
    const value = parseDecimal(amount);
    if (unitId == null || value == null || value < 0 || !validMonth(start) || (end && !validMonth(end))) {
      Alert.alert('Dados inválidos', 'Informe a UC geradora, o valor e os meses no formato AAAA-MM.');
      return;
    }
    const body = { consumer_unit_id: unitId, amount: value, start_month: start, end_month: end || null, description: description.trim() || null };
    setBusy(true);
    try {
      if (isNew) await api.createInstallment(body);
      else await api.updateInstallment(Number(id), body);
      router.back();
    } catch (e) {
      Alert.alert('Não foi possível salvar', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = () => confirmDestructive('Excluir parcela', 'Esta parcela deixa de contar no custo das placas.', async () => {
    try { await api.deleteInstallment(Number(id)); router.back(); }
    catch (e) { Alert.alert('Não foi possível excluir', errorMessage(e)); }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ title: isNew ? 'Nova parcela' : 'Editar parcela' }} />
        <State loading={(units.loading && !units.data) || (list.loading && !list.data)} error={units.error ?? list.error} onRetry={() => { void units.reload(); void list.reload(); }} />
        <Card style={{ gap: 10 }}>
          <OptionChips<number> label="Unidade geradora" value={unitId} onChange={(v) => editable && setUnitId(v)} options={generators.map((g) => ({ value: g.id, label: g.name }))} />
          <Field label="Valor da parcela (R$ por mês)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" editable={editable} />
          <Field label="Mês inicial (AAAA-MM)" value={start} onChangeText={setStart} autoCapitalize="none" editable={editable} />
          <Field label="Mês final (AAAA-MM, vazio = sem data final)" value={end} onChangeText={setEnd} autoCapitalize="none" editable={editable} />
          <Field label="Descrição" value={description} onChangeText={setDescription} editable={editable} placeholder="Financiamento das placas" />
        </Card>
        {editable ? <Button title="Salvar" onPress={save} loading={busy} /> : null}
        {editable && !isNew ? <View><Button title="Excluir parcela" variant="ghost" onPress={remove} /></View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
