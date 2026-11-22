import React, { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { monthLabel } from '../lib/format';
import { DEFAULT_PERIOD, type Period } from '../lib/period';
import { useTheme } from '../theme';
import { Chip } from './ui';

/** Botão que abre uma lista de meses ("Y-m") para escolha. */
function MonthButton({ label, value, months, onChange }: { label: string; value: string; months: string[]; onChange: (m: string) => void }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={{ borderWidth: 1, borderColor: t.border, backgroundColor: t.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
        <Text style={{ color: t.muted, fontSize: 11 }}>{label}</Text>
        <Text style={{ color: t.text, fontWeight: '700' }}>{monthLabel(value)} ▾</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: t.card, borderRadius: 14, maxHeight: '70%', padding: 8 }}>
            <FlatList
              data={[...months].reverse()}
              keyExtractor={(m) => m}
              renderItem={({ item }) => (
                <Pressable onPress={() => { onChange(item); setOpen(false); }} style={{ padding: 12 }}>
                  <Text style={{ color: item === value ? t.primary : t.text, fontWeight: item === value ? '800' : '500', fontSize: 16 }}>{monthLabel(item)}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const PRESETS = [{ label: '6 meses', months: 6 }, { label: '12 meses', months: 12 }, { label: 'Tudo', months: 0 }];

/** Filtro de período: 6/12 meses, tudo, um mês específico ou um período (de/até). `months` = meses com dados, em ordem crescente. */
export function PeriodFilter({ value, onChange, months }: { value: Period; onChange: (p: Period) => void; months: string[] }) {
  const last = months[months.length - 1];
  const pick = (mode: 'month' | 'range') => {
    if (!last) return;
    onChange(mode === 'month' ? { mode: 'month', month: last } : { mode: 'range', from: months[Math.max(months.length - 6, 0)], to: last });
  };
  return (
    <View style={{ gap: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
        {PRESETS.map((p) => (
          <Chip key={p.months} label={p.label} active={value.mode === 'last' && value.months === p.months} onPress={() => onChange({ mode: 'last', months: p.months })} />
        ))}
        <Chip label="Mês" active={value.mode === 'month'} onPress={() => pick('month')} />
        <Chip label="Período" active={value.mode === 'range'} onPress={() => pick('range')} />
      </ScrollView>
      {value.mode === 'month' ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <MonthButton label="Mês" value={value.month} months={months} onChange={(m) => onChange({ mode: 'month', month: m })} />
        </View>
      ) : null}
      {value.mode === 'range' ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <MonthButton label="De" value={value.from} months={months} onChange={(m) => onChange({ mode: 'range', from: m, to: value.to })} />
          <MonthButton label="Até" value={value.to} months={months} onChange={(m) => onChange({ mode: 'range', from: value.from, to: m })} />
        </View>
      ) : null}
    </View>
  );
}

export { DEFAULT_PERIOD };
