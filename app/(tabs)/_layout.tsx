import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text } from 'react-native';
import { useAuth } from '../../src/lib/auth';
import { useTheme } from '../../src/theme';

const icon = (e: string) => () => <Text style={{ fontSize: 18 }}>{e}</Text>;

export default function TabsLayout() {
  const t = useTheme();
  const router = useRouter();
  const { can } = useAuth();
  const account = () => (
    <Pressable onPress={() => router.push('/account')} hitSlop={12} style={{ marginRight: 16 }}>
      <Text style={{ fontSize: 20 }}>👤</Text>
    </Pressable>
  );
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: t.primary,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border },
        headerStyle: { backgroundColor: t.card },
        headerTintColor: t.text,
        headerRight: account,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Painel', tabBarIcon: icon('📊') }} />
      <Tabs.Screen name="units" options={{ title: 'Unidades', tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="generation" options={{ title: 'Geração', tabBarIcon: icon('☀️') }} />
      <Tabs.Screen name="invoices" options={{ title: 'Faturas', tabBarIcon: icon('🧾') }} />
      <Tabs.Screen name="rateio" options={{ title: 'Rateio', tabBarIcon: icon('💸'), href: can('pagamentos.ver') ? undefined : null }} />
    </Tabs>
  );
}
