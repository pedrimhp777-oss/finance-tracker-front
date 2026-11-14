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

/** Fuso do usuário, usado em todas as consultas com filtro de período. */
export const userTimezone =
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

function filterParams(filters: TransactionFilters) {
  return {
    month: filters.month || undefined,
    year: filters.year || undefined,
    category: filters.category || undefined,
    search: filters.search || undefined,
    timezone_name: userTimezone,
  };
}

/**
 * Centraliza o acesso à API de transações: listagem com filtros no servidor,
 * resumo financeiro autoritativo do backend e operações CRUD.
 */
export function useTransactions(filters: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_income: 0,
    total_expense: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (skip: number, currentFilters: TransactionFilters) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const params = {
          ...filterParams(currentFilters),
          skip,
          limit: PAGE_SIZE,
        };
        const [listRes, summaryRes] = await Promise.all([
          api.get<Transaction[]>('/transactions/', {
            params,
            signal: controller.signal,
          }),
          api.get<Summary>('/transactions/summary', {
            params: filterParams(currentFilters),
            signal: controller.signal,
          }),
        ]);
        setTransactions(listRes.data.map((t) => ({ ...t, amount: Number(t.amount) })));
        setSummary({
          total_income: Number(summaryRes.data.total_income),
          total_expense: Number(summaryRes.data.total_expense),
          balance: Number(summaryRes.data.balance),
        });
        setHasMore(listRes.data.length === PAGE_SIZE);
      } catch (err) {
        if (!controller.signal.aborted) {
          toast.error(getApiErrorMessage(err, 'Erro ao carregar os dados financeiros.'));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchPage(0, filters);
    // fetchPage é estável; filters é a fonte de verdade dos filtros.
  }, [fetchPage, filters]);

  const loadMore = useCallback(() => {
    return fetchPage(transactions.length, filters);
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
    loading,
    hasMore,
    loadMore,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    exportExcel,
  };
}
