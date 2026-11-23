import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { api, getApiErrorMessage } from '../services/api';
import type {
  Summary,
  Transaction,
  TransactionFilters,
  TransactionPayload,
} from '../types/finance';

const PAGE_SIZE = 100;
const SEARCH_DEBOUNCE_MS = 350;

/** Fuso do usuário, usado em todas as consultas com filtro de período. */
export const userTimezone =
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export interface CategoryTotal {
  category: string;
  total: number;
}

function filterParams(filters: TransactionFilters) {
  return {
    month: filters.month || undefined,
    year: filters.year || undefined,
    day: filters.day || undefined,
    category: filters.category || undefined,
    search: filters.search || undefined,
    timezone_name: userTimezone,
  };
}

/**
 * Centraliza o acesso à API de transações: listagem com filtros no servidor,
 * resumo financeiro e agregação por categoria autoritativos do backend e
 * operações CRUD. A busca tem debounce para evitar requisições a cada tecla.
 */
export function useTransactions(filters: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_income: 0,
    total_expense: 0,
    balance: 0,
  });
  const [expensesByCategory, setExpensesByCategory] = useState<CategoryTotal[]>([]);
  /** Primeira carga: é o único momento em que a tabela pode sair da tela. */
  const [loading, setLoading] = useState(true);
  /** Recarga com dados já visíveis (filtro, criação, edição, exclusão). */
  const [refreshing, setRefreshing] = useState(false);
  /** Paginação: "Carregar mais" mantém a tabela inteira na tela. */
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  /** Anos com transações (histórico completo, não só a página atual). */
  const [years, setYears] = useState<number[]>([]);
  const hasLoadedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (
      skip: number,
      currentFilters: TransactionFilters,
      mode: 'replace' | 'append' = 'replace',
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Só a primeira carga pode trocar a tabela por "Carregando...". Refiltragem,
      // CRUD e paginação mantêm os dados na tela: piscar o histórico a cada
      // interação fazia a tabela desaparecer sem necessidade.
      if (mode === 'append') setLoadingMore(true);
      else if (hasLoadedRef.current) setRefreshing(true);
      else setLoading(true);

      try {
        const params = {
          ...filterParams(currentFilters),
          skip,
          limit: PAGE_SIZE,
        };        const [listRes, summaryRes, categoriesRes, yearsRes] = await Promise.all([
          api.get<Transaction[]>('/transactions/', {
            params,
            signal: controller.signal,
          }),
          api.get<Summary>('/transactions/summary', {
            params: filterParams(currentFilters),
            signal: controller.signal,
          }),
          api.get<CategoryTotal[]>('/transactions/categories', {
            params: filterParams(currentFilters),
            signal: controller.signal,
          }),
          // Anos só mudam quando a lista é substituída; paginar não os altera.
          mode === 'replace'
            ? api.get<number[]>('/transactions/years', {
                params: { timezone_name: userTimezone },
                signal: controller.signal,
              })
            : Promise.resolve({ data: null }),
        ]);
        const page = listRes.data.map((t) => ({ ...t, amount: Number(t.amount) }));
        setTransactions((prev) => {
          if (mode === 'replace') return page;
          // Append com deduplicação por id (evita registros repetidos se o
          // servidor receber a mesma página duas vezes).
          const seen = new Set(prev.map((t) => t.id));
          return [...prev, ...page.filter((t) => !seen.has(t.id))];
        });
        setSummary({
          total_income: Number(summaryRes.data.total_income),
          total_expense: Number(summaryRes.data.total_expense),
          balance: Number(summaryRes.data.balance),
        });
        setExpensesByCategory(
          categoriesRes.data.map((row) => ({
            category: row.category,
            total: Number(row.total),
          })),
        );
        if (yearsRes.data) setYears(yearsRes.data.map(Number));
        setHasMore(page.length === PAGE_SIZE);
        hasLoadedRef.current = true;
      } catch (err) {
        if (!controller.signal.aborted) {
          toast.error(getApiErrorMessage(err, 'Erro ao carregar os dados financeiros.'));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [],
  );

  // Debounce: evita disparar 3 requisições a cada tecla na busca.
  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchPage(0, filters);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // fetchPage é estável; filters é a fonte de verdade dos filtros.
  }, [fetchPage, filters]);

  const loadMore = useCallback(() => {
    return fetchPage(transactions.length, filters, 'append');
  }, [fetchPage, transactions.length, filters]);

  const createTransaction = useCallback(async (payload: TransactionPayload) => {
    await api.post('/transactions/', payload);
    toast.success('Transação adicionada!');
    await fetchPage(0, filters);
  }, [fetchPage, filters]);

  const updateTransaction = useCallback(async (id: number, payload: TransactionPayload) => {
    await api.put(`/transactions/${id}`, payload);
    toast.success('Transação atualizada com sucesso!');
    await fetchPage(0, filters);
  }, [fetchPage, filters]);

  const deleteTransaction = useCallback(async (id: number) => {
    await api.delete(`/transactions/${id}`);
    toast.success('Transação removida.');
    await fetchPage(0, filters);
  }, [fetchPage, filters]);

  const exportExcel = useCallback(async () => {
    const response = await api.get('/transactions/export/excel', {
      responseType: 'blob',
      params: filterParams(filters),
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `relatorio_financeiro_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success('Relatório Excel baixado!');
  }, [filters]);

  return {
    transactions,
    summary,
    expensesByCategory,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    years,
    loadMore,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    exportExcel,
  };
}
