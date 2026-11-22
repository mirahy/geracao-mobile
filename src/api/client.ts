import Constants from 'expo-constants';
import { Directory, File, Paths } from 'expo-file-system';
import type {
  AccessRequest, AdminUser, Dashboard, DocumentImportResult, Generation, ImportedDocument, Installment, InstallmentInput, Invoice,
  MonthOption, PendingMonth, PermissionGroup, RateioPayment, RateioRow, ReceiptReading, Role, SpreadsheetImportResult, Unit, UnitFull,
  UnitInput, User, UserInput, LogQuery, LogsPage,
} from './types';

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

type Range = { from?: string | null; to?: string | null };

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
    } catch (e) {
      const detail = e instanceof Error ? e.message : '';
      // erro de rede de verdade (sem rota, DNS, timeout) x falha ao montar a requisição (ex.: arquivo ilegível)
      const network = !detail || /network|failed to fetch|timed? ?out|connect|abort|offline/i.test(detail);
      throw new ApiError(network ? 'Não foi possível conectar ao servidor. Verifique a conexão.' : `Não foi possível enviar a requisição: ${detail}`, 0);
    }
    if (res.status === 401 && this.token) {
      this.onUnauthorized();
    }
    const json = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      const outdated = res.status === 404 && /route .* could not be found/i.test(String(json?.message ?? ''));
      throw new ApiError(
        outdated ? 'O servidor ainda não tem esta função. Atualize o servidor (geracao) para a versão mais recente.' : (json?.message ?? `Erro ${res.status}`),
        res.status,
        json?.errors,
      );
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
  updateProfile(p: { name: string; email: string }) {
    return this.request<{ user: User }>('PUT', '/me', p);
  }
  updatePassword(p: { current_password: string; password: string; password_confirmation: string }) {
    return this.request<null>('PUT', '/me/password', p);
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
  generations(unitId?: number | null, range: Range = {}) {
    return this.request<{ data: Generation[] }>('GET', `/generations${buildQuery({ unit_id: unitId, from: range.from, to: range.to })}`);
  }
  saveGeneration(p: { consumer_unit_id: number; reference_month: string; generated_kwh: number }) {
    return this.request<{ data: Generation }>('POST', '/generations', p);
  }
  invoices(unitId?: number | null, range: Range = {}) {
    return this.request<{ data: Invoice[] }>('GET', `/invoices${buildQuery({ unit_id: unitId, from: range.from, to: range.to })}`);
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
  // ---- geração: exclusão, importação da planilha diária e revisão
  deleteGeneration(id: number) {
    return this.request<null>('DELETE', `/generations/${id}`);
  }
  importSpreadsheet(form: FormData) {
    return this.request<{ data: SpreadsheetImportResult }>('POST', '/generations/import', form);
  }
  pendingGenerations() {
    return this.request<{ data: PendingMonth[] }>('GET', '/generations/pending');
  }
  resolveGenerations(p: { save: string[]; dismiss: string[] }) {
    return this.request<{ data: { saved: number; dismissed: number } }>('POST', '/generations/resolve', p);
  }

  // ---- importação de faturas/demonstrativos (PDF)
  documents(unitId?: number | null) {
    return this.request<{ data: ImportedDocument[] }>('GET', `/documents${buildQuery({ unit_id: unitId })}`);
  }
  importDocuments(form: FormData) {
    return this.request<{ data: DocumentImportResult }>('POST', '/documents/import', form);
  }
  deleteDocument(id: number) {
    return this.request<null>('DELETE', `/documents/${id}`);
  }

  // ---- unidades consumidoras (cadastro)
  unit(id: number) {
    return this.request<{ data: UnitFull }>('GET', `/units/${id}`);
  }
  createUnit(p: UnitInput) {
    return this.request<{ data: UnitFull }>('POST', '/units', p);
  }
  updateUnit(id: number, p: UnitInput) {
    return this.request<{ data: UnitFull }>('PUT', `/units/${id}`, p);
  }
  deleteUnit(id: number) {
    return this.request<null>('DELETE', `/units/${id}`);
  }

  // ---- registro de atividades
  logs(q: LogQuery) {
    return this.request<LogsPage>('GET', `/logs${buildQuery({ ...q })}`);
  }

  // ---- administração
  users() {
    return this.request<{ data: AdminUser[] }>('GET', '/admin/users');
  }
  createUser(p: UserInput) {
    return this.request<{ data: AdminUser }>('POST', '/admin/users', p);
  }
  updateUser(id: number, p: UserInput) {
    return this.request<{ data: AdminUser }>('PUT', `/admin/users/${id}`, p);
  }
  deleteUser(id: number) {
    return this.request<null>('DELETE', `/admin/users/${id}`);
  }
  grantRequestedUnit(id: number) {
    return this.request<{ data: AdminUser }>('POST', `/admin/users/${id}/grant-requested-unit`);
  }
  roles() {
    return this.request<{ data: Role[] }>('GET', '/admin/roles');
  }
  permissions() {
    return this.request<{ data: PermissionGroup[] }>('GET', '/admin/permissions');
  }
  createRole(p: { name: string; permissions: string[] }) {
    return this.request<{ data: Role }>('POST', '/admin/roles', p);
  }
  updateRole(id: number, p: { name: string; permissions: string[] }) {
    return this.request<{ data: Role }>('PUT', `/admin/roles/${id}`, p);
  }
  deleteRole(id: number) {
    return this.request<null>('DELETE', `/admin/roles/${id}`);
  }
  unitRequests(status?: string | null) {
    return this.request<{ data: AccessRequest[] }>('GET', `/admin/unit-requests${buildQuery({ status })}`);
  }
  approveUnitRequest(id: number, canEdit: boolean) {
    return this.request<{ data: AccessRequest }>('POST', `/admin/unit-requests/${id}/approve`, { can_edit: canEdit });
  }
  bulkUnitRequests(p: { ids: number[]; action: 'approve' | 'reject'; can_edit?: boolean; note?: string | null }) {
    return this.request<{ data: { done: number; skipped: number } }>('POST', '/admin/unit-requests/bulk', p);
  }
  rejectUnitRequest(id: number, note: string | null) {
    return this.request<{ data: AccessRequest }>('POST', `/admin/unit-requests/${id}/reject`, { note });
  }
  installments() {
    return this.request<{ data: Installment[] }>('GET', '/admin/installments');
  }
  createInstallment(p: InstallmentInput) {
    return this.request<{ data: Installment }>('POST', '/admin/installments', p);
  }
  updateInstallment(id: number, p: InstallmentInput) {
    return this.request<{ data: Installment }>('PUT', `/admin/installments/${id}`, p);
  }
  deleteInstallment(id: number) {
    return this.request<null>('DELETE', `/admin/installments/${id}`);
  }

  /** Baixa um arquivo de rota autenticada para o cache do aparelho e devolve o arquivo local. */
  private async downloadFile(path: string, cacheDir: string[], notFound: string, failed: string): Promise<File> {
    const dir = new Directory(Paths.cache, ...cacheDir);
    if (!dir.exists) dir.create({ intermediates: true });
    try {
      return await File.downloadFileAsync(`${normalizeBaseUrl(this.baseUrl)}/api/v1${path}`, dir, {
        idempotent: true,
        headers: { ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('401')) this.onUnauthorized();
      throw new ApiError(msg.includes('404') ? notFound : failed, 0);
    }
  }

  downloadReceipt(paymentId: number): Promise<File> {
    return this.downloadFile(`/rateio/payments/${paymentId}/receipt`, ['comprovantes', String(paymentId)], 'Comprovante não disponível.', 'Não foi possível baixar o comprovante.');
  }

  /** PDF original da fatura importada. */
  downloadInvoice(invoiceId: number): Promise<File> {
    return this.downloadFile(`/invoices/${invoiceId}/file`, ['faturas', String(invoiceId)], 'O arquivo original desta fatura não está disponível.', 'Não foi possível baixar a fatura.');
  }
}
