import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import type { UnitInput, UnitRole } from '../../../src/api/types';
import { Button, Card, Field, OptionChips, State, Title, Toggle, confirmDestructive, errorMessage } from '../../../src/components/ui';
import { useAuth } from '../../../src/lib/auth';
import { useAsync } from '../../../src/lib/useAsync';
import { useTheme } from '../../../src/theme';

const EMPTY: UnitInput = {
  name: '', uc_number: '', role: 'receiver', city: null, active: true, code: null, bills_solar_cost: true, counts_in_generator_cost: false,
  holder_name: null, classification: null, address: null, neighborhood: null, meter_number: null, notes: null,
};

export default function UnitForm() {
  const t = useTheme();
  const router = useRouter();
  const { api, can } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const editable = can('unidades.editar');
  const loaded = useAsync(() => (isNew ? Promise.resolve(null) : api.unit(Number(id))), [api, id]);
  const [f, setF] = useState<UnitInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const u = loaded.data?.data;
    if (u) { const { id: _id, formatted_uc: _f, ...rest } = u; setF(rest); }
  }, [loaded.data]);

  const set = <K extends keyof UnitInput>(k: K, v: UnitInput[K]) => setF((x) => ({ ...x, [k]: v }));
  const text = (k: 'code' | 'holder_name' | 'classification' | 'address' | 'neighborhood' | 'city' | 'meter_number' | 'notes') => (v: string) => set(k, v.trim() ? v : null);

  const save = async () => {
    setBusy(true);
    try {
      if (isNew) await api.createUnit(f);
      else await api.updateUnit(Number(id), f);
      router.back();
    } catch (e) {
      Alert.alert('Não foi possível salvar', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = () => confirmDestructive('Excluir unidade', `${f.name}? Faturas, demonstrativos, gerações e parcelas dela também serão removidos.`, async () => {
    try { await api.deleteUnit(Number(id)); router.back(); }
    catch (e) { Alert.alert('Não foi possível excluir', errorMessage(e)); }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ title: isNew ? 'Nova unidade' : f.name || 'Unidade' }} />
        <State loading={loaded.loading && !isNew} error={loaded.error} onRetry={loaded.reload} />
        <Card style={{ gap: 10 }}>
          <Title>Identificação</Title>
          <Field label="Nome de exibição" value={f.name} onChangeText={(v) => set('name', v)} editable={editable} />
          <OptionChips<UnitRole> label="Papel" value={f.role} onChange={(v) => editable && set('role', v)}
            options={[{ value: 'generator', label: 'Geradora (placas)' }, { value: 'receiver', label: 'Beneficiária' }]} />
          <Field label="Número da UC (somente dígitos)" value={f.uc_number} onChangeText={(v) => set('uc_number', v.replace(/\D/g, ''))} keyboardType="number-pad" editable={editable} />
          <Field label="Código da instalação" value={f.code ?? ''} onChangeText={text('code')} editable={editable} placeholder="2496572-5" />
          <Toggle label="Ativa" value={f.active} onChange={(v) => editable && set('active', v)} />
          <Toggle label="Cobrar rateio do custo das placas" hint="Beneficiárias pagam kWh transferido × custo do kWh; abatido da parcela da geradora."
            value={f.bills_solar_cost} onChange={(v) => editable && set('bills_solar_cost', v)} />
          {f.role === 'receiver' ? (
            <Toggle label="Incluir a fatura no custo do kWh da geradora" value={f.counts_in_generator_cost} onChange={(v) => editable && set('counts_in_generator_cost', v)} />
          ) : null}
        </Card>
        <Card style={{ gap: 10 }}>
          <Title>Dados cadastrais</Title>
          <Field label="Titular" value={f.holder_name ?? ''} onChangeText={text('holder_name')} editable={editable} />
          <Field label="Classificação" value={f.classification ?? ''} onChangeText={text('classification')} editable={editable} />
          <Field label="Endereço" value={f.address ?? ''} onChangeText={text('address')} editable={editable} />
          <Field label="Bairro" value={f.neighborhood ?? ''} onChangeText={text('neighborhood')} editable={editable} />
          <Field label="Cidade" value={f.city ?? ''} onChangeText={text('city')} editable={editable} />
          <Field label="Medidor" value={f.meter_number ?? ''} onChangeText={text('meter_number')} editable={editable} />
          <Field label="Observações" value={f.notes ?? ''} onChangeText={text('notes')} multiline editable={editable} />
        </Card>
        {editable ? <Button title="Salvar" onPress={save} loading={busy} disabled={!f.name.trim() || !f.uc_number} /> : null}
        {editable && !isNew ? <View><Button title="Excluir unidade" variant="ghost" onPress={remove} /></View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
