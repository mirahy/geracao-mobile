import React, { useState } from 'react';
import { Alert, FlatList, Text, TextInput, View } from 'react-native';
import { Button, Card, Chip, State, Toggle, confirmDestructive, errorMessage } from '../../src/components/ui';
import { fmtDate } from '../../src/lib/format';
import { useAuth } from '../../src/lib/auth';
import { useAsync } from '../../src/lib/useAsync';
import { useFocusReload } from '../../src/lib/useFocusReload';
import { useTheme } from '../../src/theme';

const FILTERS = [{ value: 'pending', label: 'Pendentes' }, { value: 'approved', label: 'Aprovadas' }, { value: 'rejected', label: 'Recusadas' }, { value: '', label: 'Todas' }];

export default function Requests() {
  const t = useTheme();
  const { api } = useAuth();
  const [status, setStatus] = useState('pending');
  const [canEdit, setCanEdit] = useState<Record<number, boolean>>({});
  const [note, setNote] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkNote, setBulkNote] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const list = useAsync(() => api.unitRequests(status || null), [api, status]);
  const pendingIds = (list.data?.data ?? []).filter((r) => r.status === 'pending').map((r) => r.id);
  const toggle = (id: number) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const chosen = selected.filter((id) => pendingIds.includes(id));

  const bulk = async (action: 'approve' | 'reject') => {
    setBulkBusy(true);
    try {
      const { data } = await api.bulkUnitRequests({ ids: chosen, action, note: action === 'reject' ? bulkNote.trim() || null : undefined });
      Alert.alert(
        action === 'approve' ? 'Solicitações aprovadas' : 'Solicitações recusadas',
        `${data.done} solicitação(ões) respondida(s).${data.skipped ? `\n${data.skipped} já tinha(m) sido respondida(s) e foi(ram) ignorada(s).` : ''}`,
      );
      setSelected([]); setBulkNote('');
      await list.reload();
    } catch (e) {
      Alert.alert('Não foi possível responder', errorMessage(e));
    } finally {
      setBulkBusy(false);
    }
  };
  useFocusReload(list.reload);

  const decide = async (id: number, approve: boolean) => {
    setBusy(id);
    try {
      if (approve) await api.approveUnitRequest(id, !!canEdit[id]);
      else await api.rejectUnitRequest(id, note[id]?.trim() || null);
      await list.reload();
    } catch (e) {
      Alert.alert('Não foi possível responder', errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <FlatList
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={list.data?.data ?? []}
      keyExtractor={(r) => String(r.id)}
      refreshing={list.loading}
      onRefresh={list.reload}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 }}>
            {FILTERS.map((f) => <Chip key={f.value} label={f.label} active={status === f.value} onPress={() => { setStatus(f.value); setSelected([]); }} />)}
          </View>
          {pendingIds.length > 0 ? (
            <Card style={{ gap: 8 }}>
              <Text style={{ color: t.text, fontWeight: '700' }}>{chosen.length} selecionada(s) de {pendingIds.length} pendente(s)</Text>
              <Button title={chosen.length === pendingIds.length ? 'Limpar seleção' : 'Selecionar todas as pendentes'} variant="ghost" onPress={() => setSelected(chosen.length === pendingIds.length ? [] : pendingIds)} />
              {chosen.length > 0 ? (
                <View style={{ gap: 8 }}>
                  <Button title={`Aprovar selecionadas (somente leitura)`} loading={bulkBusy}
                    onPress={() => confirmDestructive('Aprovar solicitações', `Aprovar ${chosen.length} solicitação(ões) com acesso somente leitura?`, () => void bulk('approve'), 'Aprovar')} />
                  <TextInput placeholder="Motivo da recusa (opcional)" placeholderTextColor={t.muted} value={bulkNote} onChangeText={setBulkNote}
                    style={{ borderWidth: 1, borderColor: t.border, borderRadius: 10, padding: 10, color: t.text }} />
                  <Button title="Recusar selecionadas" variant="ghost" disabled={bulkBusy}
                    onPress={() => confirmDestructive('Recusar solicitações', `Recusar ${chosen.length} solicitação(ões)? Os usuários serão avisados.`, () => void bulk('reject'), 'Recusar')} />
                </View>
              ) : null}
            </Card>
          ) : null}
          <State loading={list.loading && !list.data} error={list.error} onRetry={list.reload} />
        </View>
      }
      renderItem={({ item }) => (
        <Card style={{ gap: 6 }}>
          {item.status === 'pending' ? (
            <Toggle label="Selecionar" value={selected.includes(item.id)} onChange={() => toggle(item.id)} />
          ) : null}
          <Text style={{ color: t.text, fontWeight: '700' }}>{item.user_name} · {item.unit_name}</Text>
          <Text style={{ color: t.muted }}>{item.user_email} · UC {item.unit_uc}</Text>
          {item.message ? <Text style={{ color: t.text }}>“{item.message}”</Text> : null}
          <Text style={{ color: t.muted, fontSize: 12 }}>{item.status_label} · pedido em {fmtDate(item.created_at)}{item.decided_by ? ` · por ${item.decided_by}` : ''}{item.decision_note ? ` · ${item.decision_note}` : ''}</Text>
          {item.status === 'pending' ? (
            <View style={{ gap: 8, marginTop: 6 }}>
              <Toggle label="Permitir edição da unidade" value={!!canEdit[item.id]} onChange={(v) => setCanEdit((c) => ({ ...c, [item.id]: v }))} />
              <Button title="Aprovar" onPress={() => void decide(item.id, true)} loading={busy === item.id} />
              <TextInput placeholder="Motivo da recusa (opcional)" placeholderTextColor={t.muted} value={note[item.id] ?? ''} onChangeText={(v) => setNote((n) => ({ ...n, [item.id]: v }))}
                style={{ borderWidth: 1, borderColor: t.border, borderRadius: 10, padding: 10, color: t.text }} />
              <Button title="Recusar" variant="ghost" onPress={() => void decide(item.id, false)} disabled={busy === item.id} />
            </View>
          ) : null}
        </Card>
      )}
    />
  );
}
