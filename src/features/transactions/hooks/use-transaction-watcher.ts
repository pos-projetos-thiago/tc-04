import { useEffect } from 'react';

import { invalidateDashboard } from '@/src/features/dashboard/services/dashboard-service.instance';

import { useTransactionContext } from './use-transaction-context';

/**
 * Reage a mudanças recentes por meio do contrato da feature.
 * A implementação Firestore mantém o listener limitado a um documento para
 * conter leituras; exclusões antigas ainda são atualizadas ao focar a tela.
 */
export function useTransactionWatcher(
  userId: string | null,
  onChanged: () => void,
): void {
  const { service } = useTransactionContext();

  useEffect(() => {
    if (!userId) return;

    return service.watchLatestChange(
      userId,
      () => {
        invalidateDashboard(userId);
        onChanged();
      },
      (error) => {
        // A recarga ao focar a tela continua como fallback de consistência.
        console.warn('[useTransactionWatcher] listener error:', error.message);
      },
    );
  }, [service, userId, onChanged]);
}
