import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { ApiError } from '../../src/api/client';
import { Button, Card, Field } from '../../src/components/ui';
import { UnitFilter } from '../../src/components/Filters';
import { fmtBrl, fmtDate, maskBrDate, parseBrDate, parseDecimal } from '../../src/lib/format';
import { useAuth } from '../../src/lib/auth';
import { filePart } from '../../src/lib/upload';
import { useAsync } from '../../src/lib/useAsync';
import { useTheme } from '../../src/theme';

type Picked = DocumentPicker.DocumentPickerAsset;

function receiptForm(file: Picked): FormData {
  const form = new FormData();
  form.append('receipt', filePart(file, 'application/octet-stream'));
  return form;
}

export default function NewPayment() {
  const t = useTheme();
  const router = useRouter();
  const { api } = useAuth();
  const units = useAsync(() => api.units(), [api]);
  const receivers = (units.data?.data ?? []).filter((u) => u.role === 'receiver');
  const [unitId, setUnitId] = useState<number | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [amount, setAmount] = useState('');
  const [paidAt, setPaidAt] = useState('');
  const [payer, setPayer] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<Picked | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (res.canceled || !res.assets[0]) return;
    const picked = res.assets[0];
    setFile(picked);
    setBusy(true);
    try {
      const { data } = await api.readReceipt(receiptForm(picked));
      if (data.already_registered) Alert.alert('Comprovante repetido', 'Este comprovante já foi lançado.');
      if (data.amount != null) setAmount(String(data.amount).replace('.', ','));
      if (data.paid_at) setPaidAt(fmtDate(data.paid_at));
      if (data.payer_name) setPayer(data.payer_name);
      if (data.transaction_id) setTransactionId(data.transaction_id);
      if (data.suggested_unit_id) setUnitId(data.suggested_unit_id);
      if (data.suggested_month) setMonth(data.suggested_month);
      setInfo(data.readable
        ? `Lido do comprovante${data.payer_name ? ` · ${data.payer_name}` : ''}${data.amount != null ? ` · ${fmtBrl(data.amount)}` : ''}. Confira os dados.`
        : 'Não foi possível ler o comprovante. Informe os dados manualmente.');
    } catch (e) {
      setInfo(e instanceof Error ? e.message : 'Falha ao ler o comprovante.');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    const value = parseDecimal(amount);
    if (unitId == null || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || (value == null && !file)) {
      Alert.alert('Dados inválidos', 'Escolha a UC, o mês (AAAA-MM) e informe o valor (ou anexe um comprovante legível).');
      return;
    }
    const paidIso = paidAt.trim() ? parseBrDate(paidAt) : null;
    if (paidAt.trim() && !paidIso) {
      Alert.alert('Data inválida', 'Informe a data do pagamento como DD/MM/AAAA.');
      return;
    }
    const form = file ? receiptForm(file) : new FormData();
    form.append('consumer_unit_id', String(unitId));
    form.append('reference_month', month);
    if (value != null) form.append('amount', String(value));
    if (paidIso) form.append('paid_at', paidIso);
    if (payer.trim()) form.append('payer_name', payer.trim());
    if (transactionId.trim()) form.append('transaction_id', transactionId.trim());
    if (notes.trim()) form.append('notes', notes.trim());
    setBusy(true);
    try {
      await api.saveRateioPayment(form);
      router.back();
    } catch (e) {
      const first = e instanceof ApiError ? Object.values(e.errors ?? {})[0]?.[0] : undefined;
      Alert.alert('Não foi possível salvar', first ?? (e instanceof Error ? e.message : 'Erro inesperado'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 10 }}>
          <Button title={file ? `Comprovante: ${file.name}` : 'Anexar comprovante (PDF ou imagem)'} variant="ghost" onPress={pick} disabled={busy} />
          {info ? <Text style={{ color: t.muted, fontSize: 13 }}>{info}</Text> : null}
        </Card>
        <Card style={{ gap: 10 }}>
          <Text style={{ color: t.muted, fontSize: 13 }}>Unidade beneficiária</Text>
          <UnitFilter units={receivers} value={unitId} onChange={(id) => setUnitId(id)} />
          <Field label="Mês de referência (AAAA-MM)" value={month} onChangeText={setMonth} autoCapitalize="none" />
          <Field label="Valor pago (R$)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="ex.: 150,00" />
          <Field label="Pago em (DD/MM/AAAA)" value={paidAt} onChangeText={(v) => setPaidAt(maskBrDate(v))} keyboardType="number-pad" placeholder="vazio = hoje" maxLength={10} />
          <Field label="Pagador" value={payer} onChangeText={setPayer} autoCapitalize="words" />
          <Field label="Código da transação" value={transactionId} onChangeText={setTransactionId} autoCapitalize="characters" autoCorrect={false} />
          <Field label="Observações" value={notes} onChangeText={setNotes} multiline />
        </Card>
        <View><Button title="Salvar pagamento" onPress={save} loading={busy} /></View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
