import type { Transaction } from '@/src/features/transactions/types/transaction';
import type { ITransactionService } from '@/src/features/transactions/types/transaction-service.interface';
import type { TransactionFilter } from '@/src/features/transactions/types/transaction-filter';
import type { DashboardSummary } from '../types/dashboard-summary';
import {
  buildCategoryBreakdown,
  endOfMonth,
  startOfMonth,
  sumByType,
} from '../utils/dashboard-calculators';
import { getCached, setCached, invalidateUser } from './dashboard-cache';

const RECENT_COUNT = 5;

function makeSummaryKey(userId: string, referenceMonth: Date): string {
  return `${userId}:${referenceMonth.getUTCFullYear()}-${referenceMonth.getUTCMonth()}`;
}

/**
 * Busca as páginas do mês selecionado, acumulando via cursor para montar
 * os gráficos por categoria e as listas recentes.
 */
async function fetchAllPages(
  transactionService: ITransactionService,
  userId: string,
  filter: TransactionFilter,
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
 * Obtém os totais históricos por agregação no Firestore e busca os documentos
 * do mês de referência para calcular categorias e listar transações recentes.
 *
 * Semântica:
 *   balance  = income(all) - expense(all) - investment(all)
 *   netWorth = income(all) - expense(all)
 *
 * Cache: resultados são armazenados em memória por 5 minutos, isolados por
 * userId. Chame `invalidateDashboard(userId)` após mutações para forçar
 * um refetch na próxima chamada.
 */
export function createDashboardService(transactionService: ITransactionService) {
  let nextRequestId = 0;
  const latestRequestByKey = new Map<string, number>();
  const invalidationVersionByUser = new Map<string, number>();

  async function getSummary(
    userId: string,
    referenceMonth: Date = new Date(),
  ): Promise<DashboardSummary> {
    const cached = getCached(userId, referenceMonth);
    if (cached) return cached;

    const cacheKey = makeSummaryKey(userId, referenceMonth);
    const requestId = ++nextRequestId;
    const invalidationVersion = invalidationVersionByUser.get(userId) ?? 0;
    latestRequestByKey.set(cacheKey, requestId);

    const monthStart = startOfMonth(referenceMonth);
    const monthEnd = endOfMonth(referenceMonth);

    let monthTransactions: Transaction[];
    let lifetimeTotals: Awaited<ReturnType<ITransactionService['getLifetimeTotals']>>;
    try {
      [lifetimeTotals, monthTransactions] = await Promise.all([
        transactionService.getLifetimeTotals(userId),
        fetchAllPages(transactionService, userId, {
          type: null,
          category: null,
          dateRange: { start: monthStart, end: monthEnd },
        }),
      ]);
    } catch (error) {
      if (latestRequestByKey.get(cacheKey) === requestId) {
        latestRequestByKey.delete(cacheKey);
      }
      throw error;
    }

    const monthCurrentAccount = monthTransactions.filter((t) => t.type !== 'investment');
    const monthInvestments = monthTransactions.filter((t) => t.type === 'investment');

    const totalIncome = sumByType(monthTransactions, 'income');
    const totalExpense = sumByType(monthTransactions, 'expense');
    const totalInvested = sumByType(monthTransactions, 'investment');

    const summary: DashboardSummary = {
      balance: lifetimeTotals.income - lifetimeTotals.expense - lifetimeTotals.investment,
      netWorth: lifetimeTotals.income - lifetimeTotals.expense,
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

    // Só a solicitação mais recente pode preencher o cache. Uma busca iniciada
    // antes de uma mutação não pode restaurar dados já invalidados.
    if (latestRequestByKey.get(cacheKey) === requestId) {
      if ((invalidationVersionByUser.get(userId) ?? 0) === invalidationVersion) {
        setCached(userId, referenceMonth, summary);
      }
      latestRequestByKey.delete(cacheKey);
    }
    return summary;
  }

  function invalidateDashboard(userId: string): void {
    invalidationVersionByUser.set(
      userId,
      (invalidationVersionByUser.get(userId) ?? 0) + 1,
    );
    invalidateUser(userId);
  }

  return { getSummary, invalidateDashboard };
}
