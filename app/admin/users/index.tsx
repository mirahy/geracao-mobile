import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Button, Card, State, errorMessage } from '../../../src/components/ui';
import { useAuth } from '../../../src/lib/auth';
import { useAsync } from '../../../src/lib/useAsync';
import { useFocusReload } from '../../../src/lib/useFocusReload';
import { useTheme } from '../../../src/theme';

export default function Users() {
  const t = useTheme();
  const router = useRouter();
  const { api } = useAuth();
  const users = useAsync(() => api.users(), [api]);
  useFocusReload(users.reload);

  const grant = async (id: number) => {
    try { await api.grantRequestedUnit(id); await users.reload(); Alert.alert('Acesso liberado', 'O usuário passa a ver a unidade solicitada (somente leitura).'); }
    catch (e) { Alert.alert('Não foi possível liberar', errorMessage(e)); }
  };

  return (
    <FlatList
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={users.data?.data ?? []}
      keyExtractor={(u) => String(u.id)}
      refreshing={users.loading}
      onRefresh={users.reload}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <Button title="Novo usuário" onPress={() => router.push('/admin/users/new')} />
          <State loading={users.loading && !users.data} error={users.error} onRetry={users.reload} />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push({ pathname: '/admin/users/[id]', params: { id: String(item.id) } })}>
          <Card style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: t.text, fontWeight: '700' }}>{item.name}</Text>
              <Text style={{ color: item.status === 'pending' ? t.primary : t.good, fontWeight: '700' }}>{item.status === 'pending' ? 'Pendente' : 'Ativo'}</Text>
            </View>
            <Text style={{ color: t.muted }}>{item.email}</Text>
            <Text style={{ color: t.muted, fontSize: 12 }}>
              {item.roles.join(', ') || 'sem perfil'} · {item.unit_accesses.length} unidade(s)
            </Text>
            {item.status === 'pending' && item.requested_unit ? (
              <View style={{ marginTop: 6, gap: 4 }}>
                <Text style={{ color: t.text, fontSize: 13 }}>Pediu acesso a: {item.requested_unit}</Text>
                <Button title="Liberar unidade solicitada" variant="ghost" onPress={() => void grant(item.id)} />
              </View>
            ) : null}
          </Card>
        </Pressable>
      )}
    />
  );
}
