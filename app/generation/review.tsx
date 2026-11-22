import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { Button, Card, OptionChips, State, errorMessage } from '../../src/components/ui';
import { fmtDate, fmtKwh, monthLabel } from '../../src/lib/format';
import { useAuth } from '../../src/lib/auth';
import { useAsync } from '../../src/lib/useAsync';
import { useTheme } from '../../src/theme';

type Choice = 'save' | 'later' | 'dismiss';

/** Meses da planilha que não foram gravados sozinhos (incompletos ou divergentes do lançamento manual). */
export default function ReviewImport() {
  const t = useTheme();
  const router = useRouter();
  const { api } = useAuth();
  const pending = useAsync(() => api.pendingGenerations(), [api]);
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [busy, setBusy] = useState(false);
  const rows = pending.data?.data ?? [];
  const keyOf = (r: { unit_id: number; month: string }) => `${r.unit_id}|${r.month}`;

  const apply = async () => {
    const pick = (c: Choice) => [...new Set(rows.filter((r) => (choices[keyOf(r)] ?? 'later') === c).map((r) => r.month))];
    setBusy(true);
    try {
      const { data } = await api.resolveGenerations({ save: pick('save'), dismiss: pick('dismiss') });
      Alert.alert('Revisão concluída', [data.saved ? `${data.saved} mês(es) gravado(s).` : null, data.dismissed ? `${data.dismissed} pendência(s) descartada(s).` : null]
        .filter(Boolean).join(' ') || 'Nada foi alterado.');
      router.back();
    } catch (e) {
      Alert.alert('Não foi possível aplicar', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ color: t.muted }}>
        Estes meses não foram gravados automaticamente. Para cada um: gravar o valor da planilha, deixar para depois ou descartar a pendência (ela só volta se uma nova planilha mudar os dados do mês).
      </Text>
      <State loading={pending.loading && !pending.data} error={pending.error} onRetry={pending.reload} />
      {!pending.loading && rows.length === 0 ? <Text style={{ color: t.text }}>Nenhuma pendência. ✅</Text> : null}
      {rows.map((r) => (
        <Card key={keyOf(r)} style={{ gap: 6 }}>
          <Text style={{ color: t.text, fontWeight: '700' }}>{monthLabel(r.month)} · {r.unit_name}</Text>
          <Text style={{ color: t.muted }}>Período da fatura: {fmtDate(r.start)} a {fmtDate(r.end)} ({r.expected_days} dias)</Text>
          <Text style={{ color: r.complete ? t.text : t.bad }}>
            {r.complete ? `Planilha: ${r.days} de ${r.expected_days} dias — ${fmtKwh(r.kwh)}` : `Incompleta: só ${r.days} de ${r.expected_days} dias — soma parcial de ${fmtKwh(r.kwh)}`}
          </Text>
          {r.existing_kwh != null ? (
            <Text style={{ color: t.muted }}>Já gravado: {fmtKwh(r.existing_kwh)} ({r.existing_source === 'manual' ? 'lançado manualmente' : 'importação anterior'})</Text>
          ) : null}
          <OptionChips<Choice>
            options={[{ value: 'save', label: 'Gravar' }, { value: 'later', label: 'Depois' }, { value: 'dismiss', label: 'Descartar' }]}
            value={choices[keyOf(r)] ?? 'later'}
            onChange={(v) => setChoices((c) => ({ ...c, [keyOf(r)]: v }))}
          />
        </Card>
      ))}
      {rows.length > 0 ? <Button title="Aplicar" onPress={apply} loading={busy} /> : null}
    </ScrollView>
  );
}
