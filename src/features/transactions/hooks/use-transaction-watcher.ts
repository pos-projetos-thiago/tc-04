import { useEffect, useRef } from 'react';
import {
  collection,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import app from '@/src/lib/firebase/config';
import { invalidateDashboard } from '@/src/features/dashboard/services/dashboard.service';

/**
 * Hook de programação reativa para transações.
 *
 * Assina um listener `onSnapshot` limitado a **1 documento** (o mais recentemente
 * modificado), ordenado por `updatedAt` decrescente. Quando qualquer transação do
 * usuário for criada, editada ou excluída — em qualquer dispositivo ou sessão —
 * o Firestore notifica imediatamente este hook, que:
 *   1. Invalida o cache do dashboard para forçar um refetch na próxima abertura.
 *   2. Chama `onChanged()` para que a tela reinicie a listagem paginada.
 *
 * Por que `limit(1)` e não toda a coleção?
 *   - A paginação cursor-based existente em `useTransactions` não é compatível
 *     com um `onSnapshot` sobre toda a coleção (impossível mesclar cursores com
 *     atualizações reativas arbitrárias).
 *   - Assinar apenas 1 documento é suficiente para detectar *que* algo mudou,
 *     sem transferir todos os dados — o refresh paginado traz os dados corretos.
 *
 * Limpeza e troca de usuário:
 *   - O `useEffect` retorna `unsubscribe()` do Firestore, garantindo que a
 *     assinatura é removida quando o componente desmonta ou `userId` muda.
 *   - Sem `userId`, nenhuma assinatura é criada.
 *
 * Erros:
 *   - Erros do listener são capturados e registrados no console sem propagar
 *     para a UI, pois o fallback de `useFocusEffect` continua funcional.
 */
export function useTransactionWatcher(
  userId: string | null,
  onChanged: () => void,
): void {
  // Armazenamos o timestamp do primeiro snapshot para ignorar a emissão
  // inicial (que reflete o estado atual, não uma mudança nova).
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    initializedRef.current = false;

    const db = getFirestore(app);
    const ref = collection(db, 'transactions');
    const q = query(
      ref,
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(1),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // O primeiro snapshot é sempre emitido imediatamente com os dados atuais;
        // ignoramos para evitar um refresh duplicado ao montar o componente.
        if (!initializedRef.current) {
          initializedRef.current = true;
          return;
        }

        // Mudança real detectada: invalida o cache do dashboard e notifica.
        invalidateDashboard(userId);
        onChanged();
      },
      (error) => {
        // Falha na assinatura (ex.: permissão negada, rede).
        // O app continua funcionando via useFocusEffect — não propagamos o erro.
        console.warn('[useTransactionWatcher] onSnapshot error:', error.message);
      },
    );

    return unsubscribe;
  }, [userId, onChanged]);
}
