import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, View } from 'react-native';
import type { ActivityEntry, LogType, LogsPage } from '../../src/api/types';
import { Card, Chip, OptionChips, State } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { CHANNEL_LABEL, PERIOD_PRESETS, TYPE_LABEL, describeChanges, fmtDateTime, presetFrom, type PeriodPreset } from '../../src/lib/logs';
import { useTheme } from '../../src/theme';

const TYPES: { value: LogType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' }, { value: 'access', label: 'Acessos' }, { value: 'view', label: 'Visualizações' }, { value: 'change', label: 'Alterações' },
];

export default function Logs() {
  const t = useTheme();
  const { api } = useAuth();
  const [type, setType] = useState<LogType | 'all'>('all');
  const [userId, setUserId] = useState<number | null>(null);
  const [preset, setPreset] = useState<PeriodPreset>('7d');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<ActivityEntry[]>([]);
  const [users, setUsers] = useState<LogsPage['users']>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async (nextPage: number) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await api.logs({ type: type === 'all' ? null : type, user_id: userId, from: presetFrom(preset), search: search || null, page: nextPage });
      if (id !== requestId.current) return; // chegou depois de outro filtro ter sido escolhido
      setItems((cur) => (nextPage === 1 ? res.data : [...cur, ...res.data]));
      setUsers(res.users);
      setPage(res.meta.current_page);
      setLastPage(res.meta.last_page);
      setTotal(res.meta.total);
    } catch (e) {
      if (id === requestId.current) setError(e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [api, type, userId, preset, search]);

  useEffect(() => { void load(1); }, [load]);

  const tone = (x: LogType) => (x === 'access' ? t.series[1] : x === 'change' ? t.primary : t.muted);

  return (
    <FlatList
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={items}
      keyExtractor={(i) => String(i.id)}
      refreshing={loading && page === 1 && items.length > 0}
      onRefresh={() => void load(1)}
      onEndReachedThreshold={0.4}
      onEndReached={() => { if (!loading && page < lastPage) void load(page + 1); }}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <OptionChips<LogType | 'all'> value={type} onChange={setType} options={TYPES} />
          <OptionChips<PeriodPreset> value={preset} onChange={setPreset} options={PERIOD_PRESETS} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 }}>
            <Chip label="Todos os usuários" active={userId === null} onPress={() => setUserId(null)} />
            {users.map((u) => <Chip key={u.id} label={u.name} active={userId === u.id} onPress={() => setUserId(u.id)} />)}
          </View>
          <TextInput placeholder="Buscar (descrição ou usuário)" placeholderTextColor={t.muted} value={searchInput} onChangeText={setSearchInput}
            style={{ borderWidth: 1, borderColor: t.border, backgroundColor: t.card, borderRadius: 10, padding: 10, color: t.text }} />
          <Text style={{ color: t.muted, fontSize: 12 }}>{total} registro(s)</Text>
          <State loading={loading && items.length === 0} error={error} onRetry={() => void load(1)} />
          {!loading && !error && items.length === 0 ? <Text style={{ color: t.muted }}>Nenhum registro neste filtro.</Text> : null}
        </View>
      }
      ListFooterComponent={loading && items.length > 0 ? <ActivityIndicator style={{ margin: 16 }} color={t.primary} /> : undefined}
      renderItem={({ item }) => {
        const changes = describeChanges(item);
        return (
          <Card style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: tone(item.type), fontWeight: '700' }}>{TYPE_LABEL[item.type] ?? item.type}</Text>
              <Text style={{ color: t.muted, fontSize: 12 }}>{fmtDateTime(item.created_at)}</Text>
            </View>
            <Text style={{ color: t.text }}>{item.description}</Text>
            {changes.map((c) => <Text key={c} style={{ color: t.muted, fontSize: 12 }}>{c}</Text>)}
            <Text style={{ color: t.muted, fontSize: 12 }}>
              {item.user_name ?? 'Sistema'}{item.channel ? ` · ${CHANNEL_LABEL[item.channel]}` : ''}{item.ip ? ` · ${item.ip}` : ''}
            </Text>
          </Card>
        );
      }}
    />
  );
}
