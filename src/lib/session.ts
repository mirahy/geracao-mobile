export interface Session {
  token: string;
  expiresAt: string | null;
  user: import('../api/types').User;
}

/** Token vencido (a API também o recusa com 401, mas evitamos a ida ao servidor). */
export function isExpired(s: Pick<Session, 'expiresAt'>, now = Date.now()): boolean {
  return !!s.expiresAt && Date.parse(s.expiresAt) <= now;
}
