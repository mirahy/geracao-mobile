import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Button, Card, State } from '../../../src/components/ui';
import { useAuth } from '../../../src/lib/auth';
import { useAsync } from '../../../src/lib/useAsync';
import { useFocusReload } from '../../../src/lib/useFocusReload';
import { useTheme } from '../../../src/theme';

export default function Roles() {
  const t = useTheme();
  const router = useRouter();
  const { api } = useAuth();
  const roles = useAsync(() => api.roles(), [api]);
  useFocusReload(roles.reload);
  return (
    <FlatList
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={roles.data?.data ?? []}
      keyExtractor={(r) => String(r.id)}
      refreshing={roles.loading}
      onRefresh={roles.reload}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <Button title="Novo perfil" onPress={() => router.push('/admin/roles/new')} />
          <State loading={roles.loading && !roles.data} error={roles.error} onRetry={roles.reload} />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push({ pathname: '/admin/roles/[id]', params: { id: String(item.id) } })}>
          <Card style={{ gap: 4 }}>
            <Text style={{ color: t.text, fontWeight: '700' }}>{item.name}{item.protected ? ' 🔒' : ''}</Text>
            <Text style={{ color: t.muted }}>{item.permissions.length} permissão(ões) · {item.users_count} usuário(s)</Text>
          </Card>
        </Pressable>
      )}
    />
  );
}
