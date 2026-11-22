import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '../src/api/client';
import { Button, Field } from '../src/components/ui';
import { useAuth } from '../src/lib/auth';
import { useTheme } from '../src/theme';

export default function Login() {
  const t = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      const first = e instanceof ApiError ? Object.values(e.errors ?? {})[0]?.[0] : undefined;
      setError(first ?? (e instanceof Error ? e.message : 'Falha ao entrar'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 44 }}>☀️</Text>
            <Text style={{ color: t.text, fontSize: 24, fontWeight: '800' }}>Geração Solar</Text>
            <Text style={{ color: t.muted }}>Controle de geração, créditos e custos</Text>
          </View>
          <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" onSubmitEditing={submit} />
          {error ? <Text style={{ color: t.bad }}>{error}</Text> : null}
          <Button title="Entrar" onPress={submit} loading={busy} disabled={!email || !password} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
