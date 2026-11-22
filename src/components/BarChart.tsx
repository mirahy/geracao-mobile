import React from 'react';
import { Text, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme';
import { fmtNumber } from '../lib/format';

export interface Series { name: string; values: (number | null)[] }

/** Barras agrupadas (uma cor por série), com eixo de meses e legenda. */
export function BarChart({ labels, series, height = 180, width = 320 }: { labels: string[]; series: Series[]; height?: number; width?: number }) {
  const t = useTheme();
  const pad = { l: 8, r: 8, t: 12, b: 22 };
  const max = Math.max(1, ...series.flatMap((s) => s.values.map((v) => v ?? 0)));
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const groupW = innerW / Math.max(labels.length, 1);
  const barW = Math.max(3, (groupW * 0.75) / series.length);
  const every = Math.ceil(labels.length / 6);

  return (
    <View>
      <Svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        <Line x1={pad.l} x2={width - pad.r} y1={pad.t + innerH} y2={pad.t + innerH} stroke={t.border} />
        <SvgText x={pad.l} y={9} fontSize={9} fill={t.muted}>{fmtNumber(max)}</SvgText>
        {labels.map((label, i) => {
          const gx = pad.l + i * groupW + (groupW - barW * series.length) / 2;
          return (
            <G key={label + i}>
              {series.map((s, si) => {
                const h = ((s.values[i] ?? 0) / max) * innerH;
                return <Rect key={s.name} x={gx + si * barW} y={pad.t + innerH - h} width={barW - 1} height={h} rx={2} fill={t.series[si % t.series.length]} />;
              })}
              {i % every === 0 ? <SvgText x={pad.l + i * groupW + groupW / 2} y={height - 6} fontSize={9} textAnchor="middle" fill={t.muted}>{label}</SvgText> : null}
            </G>
          );
        })}
      </Svg>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
        {series.map((s, i) => (
          <View key={s.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: t.series[i % t.series.length] }} />
            <Text style={{ color: t.muted, fontSize: 12 }}>{s.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
