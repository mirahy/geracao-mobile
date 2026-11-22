import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Button, Card, State } from '../../../src/components/ui';
import { useAuth } from '../../../src/lib/auth';
import { useAsync } from '../../../src/lib/useAsync';
import { useFocusReload } from '../../../src/lib/useFocusReload';
import { useTheme } from '../../../src/theme';

export default function UnitsAdmin() {
  const t = useTheme();
  const router = useRouter();
  const { api, can } = useAuth();
  const units = useAsync(() => api.units(), [api]);
  useFocusReload(units.reload);
  return (
    <FlatList
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={units.data?.data ?? []}
      keyExtractor={(u) => String(u.id)}
      refreshing={units.loading}
      onRefresh={units.reload}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          {can('unidades.editar') ? <Button title="Nova unidade" onPress={() => router.push('/admin/units/new')} /> : null}
          <State loading={units.loading && !units.data} error={units.error} onRetry={units.reload} />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push({ pathname: '/admin/units/[id]', params: { id: String(item.id) } })}>
          <Card style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: t.text, fontWeight: '700' }}>{item.name}</Text>
              <Text style={{ color: t.primary, fontWeight: '700' }}>{item.role === 'generator' ? 'Geradora' : 'Beneficiária'}</Text>
            </View>
            <Text style={{ color: t.muted }}>UC {item.formatted_uc}{item.city ? ` · ${item.city}` : ''}{item.active ? '' : ' · inativa'}</Text>
          </Card>
        </Pressable>
      )}
    />
  );
}
