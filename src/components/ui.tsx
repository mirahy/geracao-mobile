import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }, style]}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <Text style={[s.title, { color: t.text }]}>{children}</Text>;
}

export function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'good' | 'bad' }) {
  const t = useTheme();
  return (
    <Card style={s.kpi}>
      <Text style={[s.kpiLabel, { color: t.muted }]}>{label}</Text>
      <Text style={[s.kpiValue, { color: tone ? t[tone] : t.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {hint ? <Text style={[s.kpiHint, { color: t.muted }]}>{hint}</Text> : null}
    </Card>
  );
}

export function Button({ title, onPress, loading, variant = 'primary', disabled }: {
  title: string; onPress: () => void; loading?: boolean; variant?: 'primary' | 'ghost'; disabled?: boolean;
}) {
  const t = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [s.btn, { backgroundColor: primary ? t.primary : 'transparent', borderColor: t.border, borderWidth: primary ? 0 : 1, opacity: pressed || disabled ? 0.7 : 1 }]}
    >
      {loading ? <ActivityIndicator color={t.primaryText} /> : <Text style={[s.btnText, { color: primary ? t.primaryText : t.text }]}>{title}</Text>}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const t = useTheme();
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: t.muted, fontSize: 13 }}>{label}</Text>
      <TextInput placeholderTextColor={t.muted} {...rest} style={[s.input, { color: t.text, borderColor: t.border, backgroundColor: t.card }, style]} />
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={[s.chip, { borderColor: active ? t.primary : t.border, backgroundColor: active ? t.primary : t.card }]}>
      <Text style={{ color: active ? t.primaryText : t.text, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function State({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry: () => void }) {
  const t = useTheme();
  if (loading) return <ActivityIndicator style={{ marginVertical: 24 }} color={t.primary} />;
  if (error) {
    return (
      <Card>
        <Text style={{ color: t.bad, marginBottom: 8 }}>{error}</Text>
        <Button title="Tentar novamente" variant="ghost" onPress={onRetry} />
      </Card>
    );
  }
  return null;
}

const s = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  kpi: { flexBasis: '47%', flexGrow: 1, gap: 2 },
  kpiLabel: { fontSize: 12 },
  kpiValue: { fontSize: 20, fontWeight: '700' },
  kpiHint: { fontSize: 11 },
  btn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnText: { fontWeight: '700', fontSize: 15 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
});
