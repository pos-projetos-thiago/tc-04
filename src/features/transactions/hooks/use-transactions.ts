/* eslint-disable react-hooks/set-state-in-effect --
 * `load` e `loadMore` são useCallbacks assíncronos: setState só é chamado
 * dentro de callbacks de Promise (após `await`), nunca de forma síncrona.
 * A regra do React Compiler v7 (eslint-plugin-react-hooks) não distingue
 * chamadas síncronas de assíncronas ao analisar estaticamente useEffect,
 * produzindo um falso positivo para este padrão de busca de dados com
 * scroll infinito.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Transaction } from '../types/transaction';
import { DEFAULT_FILTER, type TransactionFilter } from '../types/transaction-filter';
import type { ITransactionService } from '../types/transaction-service.interface';

interface UseTransactionsState {
  transactions: Transaction[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
}

interface UseTransactionsResult extends UseTransactionsState {
  refresh: () => void;
  loadMore: () => void;
}

/**
 * Carrega transações do usuário com suporte a scroll infinito.
 * `refresh` recarrega do início; `loadMore` acumula a próxima página.
 * Quando o filtro muda, a paginação é resetada automaticamente.
 *
 * Pré-carregamento: após a primeira página ser exibida, a segunda é
 * buscada silenciosamente em background e armazenada em `prefetchRef`.
 * Quando o usuário aciona `loadMore`, o resultado pré-carregado é usado
 * diretamente — sem nova requisição ao Firestore — e a próxima página
 * é pré-carregada na sequência.
 */
export function useTransactions(
  userId: string | null,
  transactionService: ITransactionService,
  filter: TransactionFilter = DEFAULT_FILTER,
): UseTransactionsResult {
  const [state, setState] = useState<UseTransactionsState>({
    transactions: [],
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    error: null,
  });

  const cursorRef = useRef<unknown>(undefined);
  const isFetchingRef = useRef(false);
  const loadGenerationRef = useRef(0);
  const filterKey = JSON.stringify(filter);

  /**
   * Cache da página pré-carregada.
   * `null`  → sem prefetch pendente ou resultado já consumido
   * objeto  → página buscada e válida, pronta para uso imediato
   */
  const prefetchRef = useRef<{
    items: Transaction[];
    cursor: unknown;
    hasMore: boolean;
  } | null>(null);

  /**
   * Token de geração do prefetch.
   * Incrementado a cada `load()` (refresh, troca de filtro, troca de usuário).
   * Uma Promise de prefetch em voo captura o token no momento do disparo;
   * ao completar, compara com o token atual — se diverge, descarta o resultado
   * sem gravar em `prefetchRef`, evitando que dados de contextos anteriores
   * contaminem a listagem corrente.
   */
  const prefetchTokenRef = useRef(0);

  /**
   * Busca a próxima página em background sem alterar o estado da UI.
   * Falhas são capturadas e descartadas silenciosamente: `loadMore` fará
   * a requisição normalmente como fallback quando `prefetchRef` estiver vazio.
   */
  const prefetchNext = useCallback(
    (cursor: unknown) => {
      if (!userId || !cursor) return;
      // Captura o token da geração atual no momento do disparo.
      const token = prefetchTokenRef.current;
      transactionService
        .getPage(userId, cursor, filter)
        .then((result) => {
          // Descarta se houve refresh/filtro/usuário diferente entre o disparo e o retorno.
          if (prefetchTokenRef.current !== token) return;
          prefetchRef.current = {
            items: result.items,
            cursor: result.hasMore ? result.cursor : undefined,
            hasMore: result.hasMore,
          };
        })
        .catch(() => {
          // Falha silenciosa: loadMore usará o fallback de requisição direta.
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, filterKey],
  );

  const load = useCallback(async () => {
    const generation = ++loadGenerationRef.current;
    if (!userId) {
      prefetchTokenRef.current += 1;
      cursorRef.current = undefined;
      prefetchRef.current = null;
      isFetchingRef.current = false;
      setState({
        transactions: [],
        isLoading: false,
        isLoadingMore: false,
        hasMore: false,
        error: null,
      });
      return;
    }

    isFetchingRef.current = true;

    // Invalida qualquer prefetch em voo do ciclo anterior.
    prefetchTokenRef.current += 1;
    cursorRef.current = undefined;
    prefetchRef.current = null;

    setState((prev) => ({
      ...prev,
      transactions: [],
      isLoading: true,
      isLoadingMore: false,
      error: null,
    }));

    try {
      const result = await transactionService.getPage(userId, undefined, filter);
      if (generation !== loadGenerationRef.current) return;
      cursorRef.current = result.hasMore ? result.cursor : undefined;
      setState({
        transactions: result.items,
        isLoading: false,
        isLoadingMore: false,
        hasMore: result.hasMore,
        error: null,
      });
      // Pré-carrega a segunda página imediatamente após exibir a primeira.
      if (result.hasMore) {
        prefetchNext(result.cursor);
      }
    } catch (err) {
      if (generation !== loadGenerationRef.current) return;
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar as transações.';
      setState({
        transactions: [],
        isLoading: false,
        isLoadingMore: false,
        hasMore: false,
        error: message,
      });
    } finally {
      if (generation === loadGenerationRef.current) {
        isFetchingRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filterKey]);

  const loadMore = useCallback(async () => {
    if (!userId) return;
    if (isFetchingRef.current) return;
    if (!cursorRef.current) return;

    isFetchingRef.current = true;
    const generation = loadGenerationRef.current;

    setState((prev) => ({ ...prev, isLoadingMore: true, error: null }));

    try {
      // Usa o resultado pré-carregado se disponível; caso contrário busca normalmente.
      const prefetched = prefetchRef.current;
      prefetchRef.current = null;

      let result: Awaited<ReturnType<typeof transactionService.getPage>>;
      if (prefetched) {
        result = prefetched;
      } else {
        // Prefetch ainda estava em voo: invalida-o antes do await para que
        // a Promise pendente, ao completar, descarte o resultado pelo token
        // divergente e não sobrescreva o prefetch que será agendado abaixo.
        prefetchTokenRef.current += 1;
        result = await transactionService.getPage(userId, cursorRef.current, filter);
      }

      if (generation !== loadGenerationRef.current) return;

      cursorRef.current = result.hasMore ? result.cursor : undefined;
      setState((prev) => ({
        ...prev,
        transactions: [...prev.transactions, ...result.items],
        isLoadingMore: false,
        hasMore: result.hasMore,
      }));
      // Pré-carrega a próxima página enquanto o usuário lê a atual.
      if (result.hasMore) {
        prefetchNext(result.cursor);
      }
    } catch (err) {
      if (generation !== loadGenerationRef.current) return;
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar mais transações.';
      setState((prev) => ({ ...prev, isLoadingMore: false, error: message }));
    } finally {
      if (generation === loadGenerationRef.current) {
        isFetchingRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filterKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    ...state,
    refresh: load,
    loadMore,
  };
}
