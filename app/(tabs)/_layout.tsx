import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../../src/theme';

const icon = (e: string) => () => <Text style={{ fontSize: 18 }}>{e}</Text>;

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: t.primary, tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border }, headerStyle: { backgroundColor: t.card }, headerTintColor: t.text }}>
      <Tabs.Screen name="index" options={{ title: 'Painel', tabBarIcon: icon('📊') }} />
      <Tabs.Screen name="units" options={{ title: 'Unidades', tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="generation" options={{ title: 'Geração', tabBarIcon: icon('☀️') }} />
      <Tabs.Screen name="invoices" options={{ title: 'Faturas', tabBarIcon: icon('🧾') }} />
      <Tabs.Screen name="account" options={{ title: 'Conta', tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}
