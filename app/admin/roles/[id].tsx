import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Button, Card, Field, State, Title, Toggle, confirmDestructive, errorMessage } from '../../../src/components/ui';
import { useAuth } from '../../../src/lib/auth';
import { useAsync } from '../../../src/lib/useAsync';
import { useTheme } from '../../../src/theme';

export default function RoleForm() {
  const t = useTheme();
  const router = useRouter();
  const { api } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const roles = useAsync(() => api.roles(), [api]);
  const catalog = useAsync(() => api.permissions(), [api]);
  const role = roles.data?.data.find((r) => String(r.id) === id);

  const [name, setName] = useState('');
  const [granted, setGranted] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (role) { setName(role.name); setGranted(role.permissions); } }, [role]);

  const toggle = (perm: string, on: boolean) => setGranted((g) => (on ? [...new Set([...g, perm])] : g.filter((p) => p !== perm)));

  const save = async () => {
    setBusy(true);
    try {
      const body = { name: name.trim(), permissions: granted };
      if (isNew) await api.createRole(body);
      else await api.updateRole(Number(id), body);
      router.back();
    } catch (e) {
      Alert.alert('Não foi possível salvar', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = () => confirmDestructive('Excluir perfil', `${name}?`, async () => {
    try { await api.deleteRole(Number(id)); router.back(); }
    catch (e) { Alert.alert('Não foi possível excluir', errorMessage(e)); }
  });

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} style={{ backgroundColor: t.bg }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: isNew ? 'Novo perfil' : 'Editar perfil' }} />
      <State loading={(roles.loading && !roles.data) || catalog.loading} error={roles.error ?? catalog.error} onRetry={() => { void roles.reload(); void catalog.reload(); }} />
      <Card style={{ gap: 8 }}>
        <Field label="Nome do perfil" value={name} onChangeText={setName} editable={!role?.protected} />
        {role?.protected ? <Text style={{ color: t.muted, fontSize: 12 }}>O Administrador tem todas as permissões e não pode ser renomeado nem excluído.</Text> : null}
      </Card>
      {(catalog.data?.data ?? []).map((g) => (
        <Card key={g.group} style={{ gap: 10 }}>
          <Title>{g.group}</Title>
          {g.permissions.map((p) => (
            <Toggle key={p.name} label={p.label} value={role?.protected ? true : granted.includes(p.name)} onChange={(v) => !role?.protected && toggle(p.name, v)} />
          ))}
        </Card>
      ))}
      <Button title="Salvar" onPress={save} loading={busy} disabled={!name.trim()} />
      {!isNew && role && !role.protected ? <View><Button title="Excluir perfil" variant="ghost" onPress={remove} /></View> : null}
      {!isNew && role && role.users_count > 0 && !role.protected ? <Text style={{ color: t.muted, fontSize: 12 }}>Perfis em uso por usuários não podem ser excluídos.</Text> : null}
    </ScrollView>
  );
}
