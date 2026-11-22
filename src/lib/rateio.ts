import type { RateioStatus } from '../api/types';

export const STATUS_LABEL: Record<RateioStatus, string> = {
  pending: 'Pendente',
  partial: 'Parcial',
  paid: 'Pago',
  overpaid: 'Pago a maior',
  without_charge: 'Sem cobrança',
};

/** Cor semântica do status, nas chaves do tema. */
export function statusTone(status: RateioStatus): 'good' | 'bad' | 'muted' | 'primary' {
  switch (status) {
    case 'paid':
    case 'overpaid':
      return 'good';
    case 'pending':
      return 'bad';
    case 'partial':
      return 'primary';
    default:
      return 'muted';
  }
}
