import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UnitFilter } from '../../src/components/Filters';
import { PeriodFilter } from '../../src/components/PeriodFilter';
import { Button, Card, State, errorMessage } from '../../src/components/ui';
import { fmtBrl, fmtDate, fmtKwh, monthLabel } from '../../src/lib/format';
import { useAuth } from '../../src/lib/auth';
import { openInReader } from '../../src/lib/openFile';
import { useAsync } from '../../src/lib/useAsync';
import { usePeriod } from '../../src/lib/usePeriod';
import { useTheme } from '../../src/theme';

export default function Invoices() {
  const t = useTheme();
  const { api, can } = useAuth();
  const [unitId, setUnitId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const { period, setPeriod, months, range, ready } = usePeriod();
  const units = useAsync(() => api.units(), [api]);
  const list = useAsync(() => api.invoices(unitId, range), [api, unitId, range.from, range.to, ready]);

  const downloadInvoice = async (id: number) => {
    setDownloading(id);
    try {
      await openInReader(await api.downloadInvoice(id), { title: 'Fatura', mimeType: 'application/pdf' });
    } catch (e) {
      Alert.alert('Fatura', errorMessage(e));
    } finally {
      setDownloading(null);
    }
  };

  const importPdfs = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: true, copyToCacheDirectory: true });
    if (res.canceled || res.assets.length === 0) return;
    const form = new FormData();
    res.assets.forEach((f) => form.append('files[]', { uri: f.uri, name: f.name, type: 'application/pdf' } as unknown as Blob));
    setImporting(true);
    try {
      const { data } = await api.importDocuments(form);
      const lines = [
        data.imported ? `${data.imported} arquivo(s) importado(s).` : null,
        data.duplicates ? `${data.duplicates} já importado(s) antes (ignorados).` : null,
        ...data.failures.map((f) => `Falha — ${f.file}: ${f.message ?? 'erro'}`),
      ].filter(Boolean);
      Alert.alert(data.failures.length ? 'Importação concluída com avisos' : 'Importação concluída', lines.join('\n') || 'Nada a importar.');
      await list.reload();
    } catch (e) {
      Alert.alert('Não foi possível importar', errorMessage(e));
    } finally {
      setImporting(false);
    }
  };

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 12 }}
        data={list.data?.data ?? []}
        keyExtractor={(i) => String(i.id)}
        refreshing={list.loading}
        onRefresh={list.reload}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <UnitFilter units={units.data?.data ?? []} value={unitId} onChange={setUnitId} />
            <PeriodFilter value={period} onChange={setPeriod} months={months} />
            {can('documentos.importar') ? <Button title="Importar faturas e demonstrativos (PDF)" onPress={importPdfs} loading={importing} /> : null}
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
            {item.has_file ? (
              <View style={{ marginTop: 6 }}>
                <Button title="Abrir fatura (PDF)" variant="ghost" onPress={() => void downloadInvoice(item.id)} loading={downloading === item.id} />
              </View>
            ) : null}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
