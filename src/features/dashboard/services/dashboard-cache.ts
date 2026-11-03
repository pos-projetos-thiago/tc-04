/**
 * Cache in-memory para o resumo do dashboard.
 *
 * Estratégia:
 *   - Chave: `${userId}:${anoMês}` (ex: "uid123:2026-11")
 *   - TTL: 5 minutos por entrada (configurável via CACHE_TTL_MS)
 *   - Limpeza: por usuário ao fazer logout (chamada explícita)
 *   - Segurança: dados isolados por userId; nenhum dado persiste
 *     entre sessões porque o cache vive apenas em memória JS.
 *
 * Limitações:
 *   - Não persiste entre reinicializações do app.
 *   - Não se invalida ao criar/editar/excluir transações automaticamente.
 *     Para isso, chame `invalidateUser(userId)` após mutações.
 */

import type { DashboardSummary } from '../types/dashboard-summary';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

interface CacheEntry {
  summary: DashboardSummary;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

function makeKey(userId: string, referenceMonth: Date): string {
  const year = referenceMonth.getFullYear();
  const month = referenceMonth.getMonth(); // 0-indexed
  return `${userId}:${year}-${month}`;
}

/**
 * Retorna o resumo em cache se ainda válido; `null` caso contrário.
 */
export function getCached(userId: string, referenceMonth: Date): DashboardSummary | null {
  const key = makeKey(userId, referenceMonth);
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.summary;
}

/**
 * Armazena um resumo no cache com o TTL padrão.
 */
export function setCached(
  userId: string,
  referenceMonth: Date,
  summary: DashboardSummary,
): void {
  const key = makeKey(userId, referenceMonth);
  store.set(key, { summary, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Remove todas as entradas de cache de um usuário específico.
 * Deve ser chamado após mutações (criar/editar/excluir transação)
 * e ao fazer logout.
 */
export function invalidateUser(userId: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(`${userId}:`)) {
      store.delete(key);
    }
  }
}

/**
 * Limpa todo o cache (útil para testes ou troca de usuário).
 */
export function clearAll(): void {
  store.clear();
}
