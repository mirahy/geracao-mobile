import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Button, Card, State } from '../../../src/components/ui';
import { fmtBrl, monthLabel } from '../../../src/lib/format';
import { useAuth } from '../../../src/lib/auth';
import { useAsync } from '../../../src/lib/useAsync';
import { useFocusReload } from '../../../src/lib/useFocusReload';
import { useTheme } from '../../../src/theme';

export default function Installments() {
  const t = useTheme();
  const router = useRouter();
  const { api, can } = useAuth();
  const list = useAsync(() => api.installments(), [api]);
  useFocusReload(list.reload);
  return (
    <FlatList
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={list.data?.data ?? []}
      keyExtractor={(i) => String(i.id)}
      refreshing={list.loading}
      onRefresh={list.reload}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          {can('parcelas.editar') ? <Button title="Nova parcela" onPress={() => router.push('/admin/installments/new')} /> : null}
          <State loading={list.loading && !list.data} error={list.error} onRetry={list.reload} />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push({ pathname: '/admin/installments/[id]', params: { id: String(item.id) } })}>
          <Card style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: t.text, fontWeight: '700' }}>{item.unit_name}</Text>
              <Text style={{ color: t.text, fontWeight: '700' }}>{fmtBrl(item.amount)}/mês</Text>
            </View>
            <Text style={{ color: t.muted }}>{monthLabel(item.start_month)} até {item.end_month ? monthLabel(item.end_month) : 'sem data final'}</Text>
            {item.description ? <Text style={{ color: t.muted, fontSize: 12 }}>{item.description}</Text> : null}
          </Card>
        </Pressable>
      )}
    />
  );
}
