export type Role = 'generator' | 'receiver';

export interface User {
  id: number;
  name: string;
  email: string;
  permissions: string[];
}

export interface Unit {
  id: number;
  name: string;
  uc_number: string;
  formatted_uc: string;
  role: Role;
  city: string | null;
  active: boolean;
}

export interface Totals {
  generated: number;
  injected: number;
  self_consumed: number;
  consumption: number;
  total_consumption: number;
  compensated: number;
  transferred: number;
  balance: number;
  cost: number;
  installments: number;
  total_cost: number;
  savings: number;
  self_savings: number;
  total_savings: number;
  net_result: number;
  solar_cost_per_kwh: number | null;
}

export interface Dashboard {
  months: string[];
  labels: string[];
  totals: Totals;
  generation: {
    generated: (number | null)[];
    injected: (number | null)[];
    self_consumed: (number | null)[];
  };
  consumption: Record<string, (number | null)[]>;
  cost: { with: number[]; without: number[] };
  units: UnitSummary[];
}

export interface UnitSummary {
  unit: Unit;
  generated: number;
  consumption: number;
  compensated: number;
  sent: number;
  received: number;
  cost: number;
  savings: number;
  balance: number;
  cost_per_kwh: number | null;
}

export interface Generation {
  id: number;
  consumer_unit_id: number;
  unit_name: string;
  reference_month: string; // Y-m-d
  generated_kwh: number;
  source: 'manual' | 'planilha';
}

export interface Invoice {
  id: number;
  consumer_unit_id: number;
  unit_name: string;
  reference_month: string;
  due_date: string | null;
  paid_at: string | null;
  consumption_kwh: number;
  injected_kwh: number;
  compensated_kwh: number;
  credit_balance_kwh: number;
  total_amount: number;
  savings: number;
}

export interface MonthOption {
  key: string; // Y-m
  label: string;
}
