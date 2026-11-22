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

export type RateioStatus = 'pending' | 'partial' | 'paid' | 'overpaid' | 'without_charge';

export interface RateioRow {
  unit_id: number;
  unit: string;
  month: string; // Y-m
  due: number;
  paid: number;
  balance: number;
  status: RateioStatus;
  payments: number;
}

export interface RateioPayment {
  id: number;
  consumer_unit_id: number;
  unit_name: string | null;
  reference_month: string;
  amount: number;
  paid_at: string | null;
  payer_name: string | null;
  transaction_id: string | null;
  source: 'manual' | 'comprovante';
  notes: string | null;
  has_receipt: boolean;
  receipt_url: string | null;
}

export interface ReceiptReading {
  readable: boolean;
  ocr_enabled: boolean;
  amount: number | null;
  paid_at: string | null;
  payer_name: string | null;
  transaction_id: string | null;
  already_registered: boolean;
  suggested_unit_id: number | null;
  suggested_month: string | null;
}
