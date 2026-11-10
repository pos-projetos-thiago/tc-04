import { useCallback, useEffect, useRef, useState } from 'react';

import { dashboardService } from '../services/dashboard-service.instance';
import type { DashboardSummary } from '../types/dashboard-summary';

interface UseDashboardState {
  summary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
}

interface UseDashboardResult extends UseDashboardState {
  refresh: () => void;
}

/**
 * Carrega o resumo financeiro do dashboard para o mês de referência.
 * Quando `referenceMonth` não é fornecido, usa o mês corrente.
 */
export function useDashboard(
  userId: string | null,
  referenceMonth?: Date,
): UseDashboardResult {
  const [state, setState] = useState<UseDashboardState>({
    summary: null,
    isLoading: false,
    error: null,
  });

  // Serializa o mês para dependência estável do useCallback
  const monthKey = referenceMonth
    ? `${referenceMonth.getUTCFullYear()}-${referenceMonth.getUTCMonth()}`
    : 'current';

  // Ref para rastrear se o componente ainda está montado, evitando setState
  // após desmontagem quando o timer dispara.
  const mountedRef = useRef(true);
  // Respostas de carregamentos antigos não podem sobrescrever um refresh novo.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    if (!userId) {
      setState({ summary: null, isLoading: false, error: null });
      return;
    }

    setState((prev) => ({
      summary: prev.summary,
      isLoading: true,
      error: null,
    }));

    try {
      const summary = await dashboardService.getSummary(userId, referenceMonth);
      if (mountedRef.current && requestId === requestIdRef.current) {
        setState({ summary, isLoading: false, error: null });
      }
    } catch (err) {
      if (mountedRef.current && requestId === requestIdRef.current) {
        const message =
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar o resumo financeiro.';
        setState({ summary: null, isLoading: false, error: message });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, monthKey]);

  useEffect(() => {
    mountedRef.current = true;
    // RN 0.87 removeu InteractionManager; requestIdleCallback agenda o fetch
    // quando a thread JS estiver ociosa e o timeout evita atraso excessivo.
    const id = requestIdleCallback(() => { void load(); }, { timeout: 1000 });
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      cancelIdleCallback(id);
    };
  }, [load]);

  return { ...state, refresh: load };
}
