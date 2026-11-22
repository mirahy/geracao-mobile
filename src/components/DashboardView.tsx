import React from 'react';
import { View } from 'react-native';
import type { Dashboard } from '../api/types';
import { fmtBrl, fmtKwh } from '../lib/format';
import { BarChart } from './BarChart';
import { Card, Kpi, Title } from './ui';

export function DashboardView({ data }: { data: Dashboard }) {
  const k = data.totals;
  const consumptionSeries = Object.entries(data.consumption).map(([name, values]) => ({ name, values }));
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <Kpi label="Geração" value={fmtKwh(k.generated)} />
        <Kpi label="Injetado na rede" value={fmtKwh(k.injected)} />
        <Kpi label="Autoconsumo" value={fmtKwh(k.self_consumed)} />
        <Kpi label="Saldo de créditos" value={fmtKwh(k.balance)} />
        <Kpi label="Economia total" value={fmtBrl(k.total_savings)} tone="good" />
        <Kpi label="Resultado líquido" value={fmtBrl(k.net_result)} tone={k.net_result >= 0 ? 'good' : 'bad'} hint="economia − parcelas" />
        <Kpi label="Custo (faturas)" value={fmtBrl(k.cost)} />
        <Kpi label="Parcelas das placas" value={fmtBrl(k.installments)} hint={k.solar_cost_per_kwh != null ? `${fmtBrl(k.solar_cost_per_kwh)}/kWh` : undefined} />
      </View>
      <Card>
        <Title>Geração (kWh)</Title>
        <BarChart
          labels={data.labels}
          series={[
            { name: 'Gerado', values: data.generation.generated },
            { name: 'Injetado', values: data.generation.injected },
            { name: 'Autoconsumo', values: data.generation.self_consumed },
          ]}
        />
      </Card>
      {consumptionSeries.length > 0 ? (
        <Card>
          <Title>Consumo por UC (kWh)</Title>
          <BarChart labels={data.labels} series={consumptionSeries.slice(0, 5)} />
        </Card>
      ) : null}
      <Card>
        <Title>Custo mensal (R$)</Title>
        <BarChart labels={data.labels} series={[{ name: 'Com solar', values: data.cost.with }, { name: 'Sem solar', values: data.cost.without }]} />
      </Card>
    </View>
  );
}
