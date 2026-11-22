import Constants from 'expo-constants';
import type { Dashboard, Generation, Invoice, MonthOption, RateioPayment, RateioRow, ReceiptReading, Unit, User } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

/** URL do servidor: EXPO_PUBLIC_API_URL (build/eas.json) ou extra.apiUrl do app.json. Não é configurável pelo usuário. */
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://10.0.2.2:8000';

export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function buildQuery(params: Record<string, string | number | null | undefined>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `?${q}` : '';
}

export class ApiClient {
  constructor(
    private baseUrl: string,
    private token: string | null,
    private onUnauthorized: () => void = () => {},
  ) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let res: Response;
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    try {
      res = await fetch(`${normalizeBaseUrl(this.baseUrl)}/api/v1${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(isForm || body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      });
    } catch {
      throw new ApiError('Não foi possível conectar ao servidor. Verifique a URL e a conexão.', 0);
    }
    if (res.status === 401 && this.token) {
      this.onUnauthorized();
    }
    const json = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(json?.message ?? `Erro ${res.status}`, res.status, json?.errors);
    }
    return json as T;
  }

  login(email: string, password: string) {
    return this.request<{ token: string; expires_at: string | null; user: User }>('POST', '/login', { email, password, device_name: 'geracao-mobile' });
  }
  logout() {
    return this.request<null>('POST', '/logout');
  }
  me() {
    return this.request<{ user: User }>('GET', '/me');
  }
  months() {
    return this.request<{ data: MonthOption[] }>('GET', '/months');
  }
  units() {
    return this.request<{ data: Unit[] }>('GET', '/units');
  }
  dashboard(p: { unit_id?: number | null; from?: string | null; to?: string | null }) {
    return this.request<Dashboard>('GET', `/dashboard${buildQuery(p)}`);
  }
  generations(unitId?: number | null) {
    return this.request<{ data: Generation[] }>('GET', `/generations${buildQuery({ unit_id: unitId })}`);
  }
  saveGeneration(p: { consumer_unit_id: number; reference_month: string; generated_kwh: number }) {
    return this.request<{ data: Generation }>('POST', '/generations', p);
  }
  invoices(unitId?: number | null) {
    return this.request<{ data: Invoice[] }>('GET', `/invoices${buildQuery({ unit_id: unitId })}`);
  }
  rateioSummary(unitId?: number | null) {
    return this.request<{ data: RateioRow[] }>('GET', `/rateio/summary${buildQuery({ unit_id: unitId })}`);
  }
  rateioPayments(unitId?: number | null) {
    return this.request<{ data: RateioPayment[] }>('GET', `/rateio/payments${buildQuery({ unit_id: unitId })}`);
  }
  saveRateioPayment(form: FormData) {
    return this.request<{ data: RateioPayment }>('POST', '/rateio/payments', form);
  }
  deleteRateioPayment(id: number) {
    return this.request<null>('DELETE', `/rateio/payments/${id}`);
  }
  readReceipt(form: FormData) {
    return this.request<{ data: ReceiptReading }>('POST', '/rateio/receipts/read', form);
  }
}
