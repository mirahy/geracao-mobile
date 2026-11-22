import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, State } from '../../src/components/ui';
import { fmtBrl, fmtKwh } from '../../src/lib/format';
import { useAuth } from '../../src/lib/auth';
import { useAsync } from '../../src/lib/useAsync';
import { useTheme } from '../../src/theme';

export default function Units() {
  const t = useTheme();
  const router = useRouter();
  const { api } = useAuth();
  const dash = useAsync(() => api.dashboard({}), [api]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 12 }}
        data={dash.data?.units ?? []}
        keyExtractor={(i) => String(i.unit.id)}
        refreshing={dash.loading}
        onRefresh={dash.reload}
        ListHeaderComponent={<State loading={dash.loading && !dash.data} error={dash.error} onRetry={dash.reload} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/unit/[id]', params: { id: String(item.unit.id), name: item.unit.name } })}>
            <Card style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{item.unit.name}</Text>
                <Text style={{ color: t.primary, fontWeight: '700' }}>{item.unit.role === 'generator' ? 'Geradora' : 'Beneficiária'}</Text>
              </View>
              <Text style={{ color: t.muted }}>UC {item.unit.formatted_uc}</Text>
              <Text style={{ color: t.text }}>Saldo: {fmtKwh(item.balance)} · Custo: {fmtBrl(item.cost)}</Text>
              <Text style={{ color: t.good }}>Economia: {fmtBrl(item.savings)}</Text>
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
