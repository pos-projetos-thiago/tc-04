import { transactionService } from '@/src/features/transactions/services/firestore-transaction.service';
import type { Transaction } from '@/src/features/transactions/types/transaction';
import type { DashboardSummary } from '../types/dashboard-summary';
import {
  buildCategoryBreakdown,
  calculateBalance,
  calculateNetWorth,
  endOfMonth,
  startOfMonth,
  sumByType,
} from '../utils/dashboard-calculators';
import { getCached, setCached, invalidateUser } from './dashboard-cache';

const RECENT_COUNT = 5;

/**
 * Busca todas as páginas de transações para um filtro, acumulando via cursor.
 * Necessário para calcular totais que não dependem do PAGE_SIZE fixo.
 */
async function fetchAllPages(
  userId: string,
  filter: Parameters<typeof transactionService.getPage>[2],
): Promise<Transaction[]> {
  const all: Transaction[] = [];
  let cursor: unknown = undefined;

  do {
    const page = await transactionService.getPage(userId, cursor, filter);
    all.push(...page.items);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor !== undefined);

  return all;
}

/**
 * Calcula o resumo financeiro do dashboard para o mês de referência.
 *
 * Faz duas buscas em paralelo:
 *   1. Transações do mês atual (para totais e recentes do período)
 *   2. Histórico completo (para saldo disponível e patrimônio all-time)
 *
 * Semântica:
 *   balance  = income(all) - expense(all) - investment(all)
 *   netWorth = income(all) - expense(all)
 *
 * Cache: resultados são armazenados em memória por 5 minutos, isolados por
 * userId. Chame `invalidateDashboard(userId)` após mutações para forçar
 * um refetch na próxima chamada.
 */
async function getSummary(
  userId: string,
  referenceMonth: Date = new Date(),
): Promise<DashboardSummary> {
  const cached = getCached(userId, referenceMonth);
  if (cached) return cached;

  const monthStart = startOfMonth(referenceMonth);
  const monthEnd = endOfMonth(referenceMonth);

  const dateRange = { start: monthStart, end: monthEnd };

  const [monthTransactions, allTransactions] = await Promise.all([
    fetchAllPages(userId, { type: null, category: null, dateRange }),
    fetchAllPages(userId, { type: null, category: null, dateRange: null }),
  ]);

  const monthCurrentAccount = monthTransactions.filter((t) => t.type !== 'investment');
  const monthInvestments = monthTransactions.filter((t) => t.type === 'investment');

  const totalIncome = sumByType(monthTransactions, 'income');
  const totalExpense = sumByType(monthTransactions, 'expense');
  const totalInvested = sumByType(monthTransactions, 'investment');

  const balance = calculateBalance(allTransactions);
  const netWorth = calculateNetWorth(allTransactions);

  const summary: DashboardSummary = {
    balance,
    netWorth,
    totalIncome,
    totalExpense,
    totalInvested,
    transactionCount: monthCurrentAccount.length,
    recentTransactions: monthCurrentAccount.slice(0, RECENT_COUNT),
    expensesByCategory: buildCategoryBreakdown(
      monthTransactions.filter((t) => t.type === 'expense'),
    ),
    incomeByCategory: buildCategoryBreakdown(
      monthTransactions.filter((t) => t.type === 'income'),
    ),
    investmentsByCategory: buildCategoryBreakdown(monthInvestments),
    recentInvestments: monthInvestments.slice(0, RECENT_COUNT),
    referenceMonth: monthStart,
  };

  setCached(userId, referenceMonth, summary);
  return summary;
}

/**
 * Invalida o cache do dashboard para um usuário.
 * Deve ser chamado após criar, editar ou excluir transações para garantir
 * que o próximo acesso ao dashboard reflita os dados mais recentes.
 */
export function invalidateDashboard(userId: string): void {
  invalidateUser(userId);
}

export const dashboardService = { getSummary, invalidateDashboard };
