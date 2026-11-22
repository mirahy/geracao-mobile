import { Stack } from 'expo-router';
import React from 'react';
import { useTheme } from '../../src/theme';

export default function AdminLayout() {
  const t = useTheme();
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: t.card }, headerTintColor: t.text, contentStyle: { backgroundColor: t.bg } }}>
      <Stack.Screen name="index" options={{ title: 'Administração' }} />
      <Stack.Screen name="users/index" options={{ title: 'Usuários' }} />
      <Stack.Screen name="roles/index" options={{ title: 'Perfis e permissões' }} />
      <Stack.Screen name="requests" options={{ title: 'Solicitações de acesso' }} />
      <Stack.Screen name="units/index" options={{ title: 'Unidades consumidoras' }} />
      <Stack.Screen name="installments/index" options={{ title: 'Parcelas das placas' }} />
      <Stack.Screen name="documents" options={{ title: 'Importações' }} />
    </Stack>
  );
}
