import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import type { UnitAccess } from '../../../src/api/types';
import { Button, Card, Field, MultiChips, OptionChips, State, Title, confirmDestructive, errorMessage } from '../../../src/components/ui';
import { useAuth } from '../../../src/lib/auth';
import { useAsync } from '../../../src/lib/useAsync';
import { useTheme } from '../../../src/theme';

type Level = 'none' | 'view' | 'edit';

export default function UserForm() {
  const t = useTheme();
  const router = useRouter();
  const { api, user: me } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const users = useAsync(() => api.users(), [api]);
  const roles = useAsync(() => api.roles(), [api]);
  const units = useAsync(() => api.units(), [api]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'active' | 'pending'>('active');
  const [roleNames, setRoleNames] = useState<string[]>([]);
  const [access, setAccess] = useState<Record<number, Level>>({});
  const [busy, setBusy] = useState(false);

  const existing = users.data?.data.find((u) => String(u.id) === id);
  useEffect(() => {
    if (!existing) return;
    setName(existing.name); setEmail(existing.email); setStatus(existing.status); setRoleNames(existing.roles);
    setAccess(Object.fromEntries(existing.unit_accesses.map((a) => [a.consumer_unit_id, a.can_edit ? 'edit' : 'view'])) as Record<number, Level>);
  }, [existing]);

  const save = async () => {
    const unit_accesses: UnitAccess[] = Object.entries(access)
      .filter(([, l]) => l !== 'none')
      .map(([unitId, l]) => ({ consumer_unit_id: Number(unitId), can_edit: l === 'edit' }));
    const body = { name: name.trim(), email: email.trim(), status, roles: roleNames, unit_accesses, ...(password ? { password } : {}) };
    setBusy(true);
    try {
      if (isNew) await api.createUser(body);
      else await api.updateUser(Number(id), body);
      router.back();
    } catch (e) {
      Alert.alert('Não foi possível salvar', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = () => confirmDestructive('Excluir usuário', `${name}? O acesso e as sessões dele serão removidos.`, async () => {
    try { await api.deleteUser(Number(id)); router.back(); }
    catch (e) { Alert.alert('Não foi possível excluir', errorMessage(e)); }
  });

  const loading = (users.loading && !users.data) || roles.loading || units.loading;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ title: isNew ? 'Novo usuário' : 'Editar usuário' }} />
        <State loading={loading} error={users.error ?? roles.error ?? units.error} onRetry={() => { void users.reload(); void roles.reload(); void units.reload(); }} />
        <Card style={{ gap: 10 }}>
          <Title>Acesso</Title>
          <Field label="Nome" value={name} onChangeText={setName} autoCapitalize="words" />
          <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Field label={isNew ? 'Senha (mín. 8 caracteres)' : 'Nova senha (vazio = manter)'} value={password} onChangeText={setPassword} secureTextEntry />
          <OptionChips<'active' | 'pending'> label="Situação" value={status} onChange={setStatus}
            options={[{ value: 'active', label: 'Ativo' }, { value: 'pending', label: 'Pendente' }]} />
          <MultiChips label="Perfis (as permissões são a soma dos perfis)" value={roleNames} onChange={setRoleNames}
            options={(roles.data?.data ?? []).map((r) => ({ value: r.name, label: r.name }))} />
        </Card>
        <Card style={{ gap: 12 }}>
          <Title>Unidades consumidoras</Title>
          <Text style={{ color: t.muted, fontSize: 12 }}>Perfis com "Ver/Editar todas as unidades" ignoram esta lista.</Text>
          {(units.data?.data ?? []).map((u) => (
            <OptionChips<Level> key={u.id} label={u.name} value={access[u.id] ?? 'none'} onChange={(l) => setAccess((a) => ({ ...a, [u.id]: l }))}
              options={[{ value: 'none', label: 'Sem acesso' }, { value: 'view', label: 'Leitura' }, { value: 'edit', label: 'Edição' }]} />
          ))}
        </Card>
        <Button title="Salvar" onPress={save} loading={busy} disabled={!name || !email || (isNew && password.length < 8)} />
        {!isNew && existing && existing.id !== me?.id ? <View><Button title="Excluir usuário" variant="ghost" onPress={remove} /></View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
