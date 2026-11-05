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
 * Assina um listener `onSnapshot` limitado a **1 documento** — o mais recentemente
 * modificado, ordenado por `updatedAt` decrescente. Quando o Firestore detecta uma
 * mudança nesse conjunto, este hook:
 *   1. Invalida o cache do dashboard para forçar um refetch na próxima abertura.
 *   2. Chama `onChanged()` para que a tela reinicie a listagem paginada.
 *
 * ## O que este watcher detecta
 *
 * | Operação | Detectada? | Motivo |
 * |----------|-----------|--------|
 * | Criação de transação | ✅ Sempre | `updatedAt = now` vai para o topo |
 * | Edição de transação | ✅ Sempre | `updatedAt = now` vai para o topo |
 * | Exclusão da transação mais recente | ✅ Sim | O resultado do `limit(1)` muda |
 * | Exclusão de transação **não** mais recente | ❌ Não detectada | O `limit(1)` ainda retorna o mesmo doc mais recente; o Firestore não reporta diferença |
 *
 * **Limitação conhecida:** a exclusão de um documento antigo (cujo `updatedAt`
 * não é o mais alto da coleção) **não dispara** este listener. O usuário verá
 * a transação excluída até que a tela ganhe foco novamente — o `useFocusEffect`
 * em `TransactionListScreen` cobre esse caso via recarga imperativa ao retornar
 * à tela.
 *
 * ## Por que `limit(1)` e não toda a coleção?
 *   - A paginação cursor-based existente em `useTransactions` não é compatível
 *     com um `onSnapshot` sobre toda a coleção (impossível mesclar cursores com
 *     atualizações reativas arbitrárias sem reiniciar sempre a paginação).
 *   - Assinar a coleção completa sem limit teria custo de leitura proporcional
 *     ao número de transações a cada mudança — inviável para dados financeiros
 *     acumulados ao longo de anos.
 *   - O `limit(1)` é suficiente para criações e edições (casos mais frequentes)
 *     e para exclusões do documento mais recente.
 *
 * ## Limpeza e troca de usuário
 *   - O `useEffect` retorna `unsubscribe()` do Firestore, garantindo que a
 *     assinatura é removida quando o componente desmonta ou `userId` muda.
 *   - Sem `userId`, nenhuma assinatura é criada.
 *
 * ## Erros
 *   - Erros do listener são capturados e registrados no console sem propagar
 *     para a UI, pois o fallback de `useFocusEffect` continua funcional.
 *
 * ## Índice Firestore necessário
 *   - `userId ASC, updatedAt DESC` (incluído em `firestore.indexes.json`)
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
