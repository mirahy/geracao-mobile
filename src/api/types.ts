export type UnitRole = 'generator' | 'receiver';

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
  role: UnitRole;
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

export interface UnitFull extends Unit {
  code: string | null;
  bills_solar_cost: boolean;
  counts_in_generator_cost: boolean;
  holder_name: string | null;
  classification: string | null;
  address: string | null;
  neighborhood: string | null;
  meter_number: string | null;
  notes: string | null;
}

export interface ImportedDocument {
  id: number;
  original_name: string;
  type: 'invoice' | 'statement' | null;
  status: 'success' | 'failed' | 'pending';
  message: string | null;
  consumer_unit_id: number | null;
  unit_name: string | null;
  reference_month: string | null;
  created_at: string | null;
}

export interface DocumentImportResult {
  imported: number;
  duplicates: number;
  failures: { file: string; message: string | null }[];
}

export interface PendingMonth {
  unit_id: number;
  unit_name: string;
  month: string; // Y-m
  start: string;
  end: string;
  days: number;
  expected_days: number;
  kwh: number;
  complete: boolean;
  existing_kwh: number | null;
  existing_source: 'manual' | 'planilha' | null;
}

export interface SpreadsheetImportResult {
  days: number;
  updated: number;
  pending: PendingMonth[];
}

export interface UnitAccess {
  consumer_unit_id: number;
  can_edit: boolean;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'pending';
  roles: string[];
  unit_accesses: UnitAccess[];
  requested_unit: string | null;
}

export interface UserInput {
  name: string;
  email: string;
  password?: string;
  status: 'active' | 'pending';
  roles: string[];
  unit_accesses: UnitAccess[];
}

export interface Role {
  id: number;
  name: string;
  permissions: string[];
  users_count: number;
  protected: boolean;
}

export interface PermissionGroup {
  group: string;
  permissions: { name: string; label: string }[];
}

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface AccessRequest {
  id: number;
  user_id: number;
  user_name: string | null;
  user_email: string | null;
  consumer_unit_id: number;
  unit_name: string | null;
  unit_uc: string | null;
  message: string | null;
  status: RequestStatus;
  status_label: string;
  created_at: string | null;
  decided_by: string | null;
  decision_note: string | null;
}

export interface Installment {
  id: number;
  consumer_unit_id: number;
  unit_name: string | null;
  amount: number;
  start_month: string;
  end_month: string | null;
  description: string | null;
}

export interface InstallmentInput {
  consumer_unit_id: number;
  amount: number;
  start_month: string; // Y-m
  end_month: string | null;
  description: string | null;
}

export type UnitInput = Omit<UnitFull, 'id' | 'formatted_uc'>;
