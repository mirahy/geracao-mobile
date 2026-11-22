import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, Card, Field, Title, errorMessage } from '../src/components/ui';
import { useAuth } from '../src/lib/auth';
import { useTheme } from '../src/theme';

/** O próprio usuário altera nome, e-mail e senha. */
export default function Profile() {
  const t = useTheme();
  const router = useRouter();
  const { api, user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const { user: updated } = await api.updateProfile({ name: name.trim(), email: email.trim() });
      await updateUser(updated);
      Alert.alert('Perfil atualizado');
    } catch (e) {
      Alert.alert('Não foi possível salvar', errorMessage(e));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (password !== confirm) {
      Alert.alert('Senhas diferentes', 'A confirmação não confere com a nova senha.');
      return;
    }
    setSavingPassword(true);
    try {
      await api.updatePassword({ current_password: current, password, password_confirmation: confirm });
      setCurrent(''); setPassword(''); setConfirm('');
      Alert.alert('Senha alterada', 'As outras sessões do app foram encerradas.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) {
      Alert.alert('Não foi possível alterar a senha', errorMessage(e));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 10 }}>
          <Title>Dados</Title>
          <Field label="Nome" value={name} onChangeText={setName} autoCapitalize="words" />
          <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Button title="Salvar dados" onPress={saveProfile} loading={savingProfile} disabled={!name.trim() || !email.trim()} />
        </Card>
        <Card style={{ gap: 10 }}>
          <Title>Alterar senha</Title>
          <Field label="Senha atual" value={current} onChangeText={setCurrent} secureTextEntry />
          <Field label="Nova senha (mín. 8 caracteres)" value={password} onChangeText={setPassword} secureTextEntry />
          <Field label="Confirmar nova senha" value={confirm} onChangeText={setConfirm} secureTextEntry />
          <Button title="Alterar senha" onPress={savePassword} loading={savingPassword} disabled={!current || password.length < 8 || !confirm} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
