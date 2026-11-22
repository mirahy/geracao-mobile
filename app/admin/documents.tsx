import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Button, Card, State, confirmDestructive, errorMessage } from '../../src/components/ui';
import { fmtDate, monthLabel } from '../../src/lib/format';
import { useAuth } from '../../src/lib/auth';
import { useAsync } from '../../src/lib/useAsync';
import { useFocusReload } from '../../src/lib/useFocusReload';
import { useTheme } from '../../src/theme';

export default function Documents() {
  const t = useTheme();
  const { api, can } = useAuth();
  const [importing, setImporting] = useState(false);
  const list = useAsync(() => api.documents(), [api]);
  useFocusReload(list.reload);
  const canImport = can('documentos.importar');

  const importPdfs = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: true, copyToCacheDirectory: true });
    if (res.canceled || res.assets.length === 0) return;
    const form = new FormData();
    res.assets.forEach((f) => form.append('files[]', { uri: f.uri, name: f.name, type: 'application/pdf' } as unknown as Blob));
    setImporting(true);
    try {
      const { data } = await api.importDocuments(form);
      Alert.alert('Importação concluída', [
        data.imported ? `${data.imported} arquivo(s) importado(s).` : null,
        data.duplicates ? `${data.duplicates} já importado(s) antes.` : null,
        ...data.failures.map((x) => `Falha — ${x.file}: ${x.message ?? 'erro'}`),
      ].filter(Boolean).join('\n') || 'Nada a importar.');
      await list.reload();
    } catch (e) {
      Alert.alert('Não foi possível importar', errorMessage(e));
    } finally {
      setImporting(false);
    }
  };

  const remove = (id: number, name: string) => confirmDestructive('Excluir importação', `${name}? O PDF original também é removido.`, async () => {
    try { await api.deleteDocument(id); await list.reload(); }
    catch (e) { Alert.alert('Não foi possível excluir', errorMessage(e)); }
  });

  return (
    <FlatList
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={list.data?.data ?? []}
      keyExtractor={(d) => String(d.id)}
      refreshing={list.loading}
      onRefresh={list.reload}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          {canImport ? <Button title="Importar PDFs" onPress={importPdfs} loading={importing} /> : null}
          <State loading={list.loading && !list.data} error={list.error} onRetry={list.reload} />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable onLongPress={canImport ? () => remove(item.id, item.original_name) : undefined}>
          <Card style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ color: t.text, fontWeight: '700', flex: 1 }}>{item.original_name}</Text>
              <Text style={{ color: item.status === 'success' ? t.good : t.bad, fontWeight: '700' }}>{item.status === 'success' ? 'OK' : 'Falhou'}</Text>
            </View>
            <Text style={{ color: t.muted }}>
              {item.type === 'invoice' ? 'Fatura' : item.type === 'statement' ? 'Demonstrativo' : 'Documento'}
              {item.unit_name ? ` · ${item.unit_name}` : ''}{item.reference_month ? ` · ${monthLabel(item.reference_month)}` : ''}
            </Text>
            <Text style={{ color: t.muted, fontSize: 12 }}>Importado em {fmtDate(item.created_at)}{canImport ? ' · segure para excluir' : ''}</Text>
            {item.status !== 'success' && item.message ? <Text style={{ color: t.bad, fontSize: 12 }}>{item.message}</Text> : null}
          </Card>
        </Pressable>
      )}
    />
  );
}
