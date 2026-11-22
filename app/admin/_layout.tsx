import { Stack } from 'expo-router';
import React from 'react';
import { useTheme } from '../../src/theme';

export default function AdminLayout() {
  const t = useTheme();
  return <Stack screenOptions={{ headerStyle: { backgroundColor: t.card }, headerTintColor: t.text, contentStyle: { backgroundColor: t.bg } }} />;
}
