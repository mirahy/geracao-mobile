import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '../src/components/ui';
import { useAuth } from '../src/lib/auth';
import { useTheme } from '../src/theme';

export default function Account() {
  const t = useTheme();
  const { user, signOut } = useAuth();
  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Card style={{ gap: 4 }}>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>{user?.name}</Text>
          <Text style={{ color: t.muted }}>{user?.email}</Text>
        </Card>
        <Button title="Sair" variant="ghost" onPress={() => void signOut()} />
      </View>
    </SafeAreaView>
  );
}
