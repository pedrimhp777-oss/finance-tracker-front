import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mocka o cliente HTTP. `api.post/put/delete` também são usados pelo hook.
vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  getApiErrorMessage: (_e: unknown, fallback: string) => fallback,
}));

import { api, getApiErrorMessage as _unused } from '../services/api';
import { useTransactions } from '../hooks/useTransactions';

const mockedGet = vi.mocked(api.get);

function mockListResponse(ids: number[]) {
  return {
    data: ids.map((id) => ({
      id,
      description: `T${id}`,
      amount: '1.00',
      type: 'expense' as const,
      category: 'Outros' as const,
      date: '2026-03-01T02:00:00Z',
    })),
  };
}

const EMPTY_FILTERS = { search: '', category: '', month: '', year: '' };

describe('useTransactions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedGet.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('não faz requisições antes do debounce de busca', async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url === '/transactions/categories') return Promise.resolve({ data: [] });
      if (url === '/transactions/summary')
        return Promise.resolve({ data: { total_income: 0, total_expense: 0, balance: 0 } });
      return Promise.resolve(mockListResponse([]));
    });

    renderHook(() => useTransactions(EMPTY_FILTERS));
    expect(mockedGet).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    // 3 chamadas: lista + resumo + categorias
    expect(mockedGet).toHaveBeenCalledTimes(3);
  });

  it('loadMore acrescenta a próxima página sem perder a primeira (C1)', async () => {
    mockedGet.mockImplementation(((url: string, config?: { params?: { skip?: number } }) => {
      const skip = config?.params?.skip ?? 0;
      const ids = skip === 0 ? [1, 2] : [3, 4];
      if (url === '/transactions/categories') return Promise.resolve({ data: [] });
      if (url === '/transactions/summary')
        return Promise.resolve({ data: { total_income: 0, total_expense: 2, balance: -2 } });
      return Promise.resolve(mockListResponse(ids));
    }) as typeof api.get);

    const { result } = renderHook(() => useTransactions(EMPTY_FILTERS));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(result.current.transactions.map((t) => t.id)).toEqual([1, 2]);

    await act(async () => {
      await result.current.loadMore();
    });
    // Append: página 1 + página 2, sem substituição.
    expect(result.current.transactions.map((t) => t.id)).toEqual([1, 2, 3, 4]);

    // Requisição repetida da mesma página não gera duplicatas.
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.transactions.map((t) => t.id)).toEqual([1, 2, 3, 4]);
  });

  it('filtra categorias autoritativas do servidor (A2)', async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url === '/transactions/categories')
        return Promise.resolve({
          data: [
            { category: 'Alimentação', total: '150.00' },
            { category: 'Transporte', total: '60.00' },
          ],
        });
      if (url === '/transactions/summary')
        return Promise.resolve({ data: { total_income: 0, total_expense: 210, balance: -210 } });
      return Promise.resolve(mockListResponse([]));
    });

    const { result } = renderHook(() => useTransactions(EMPTY_FILTERS));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(result.current.expensesByCategory).toEqual([
      { category: 'Alimentação', total: 150 },
      { category: 'Transporte', total: 60 },
    ]);
  });

  it('CRUD recarrega os dados da primeira página', async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url === '/transactions/categories') return Promise.resolve({ data: [] });
      if (url === '/transactions/summary')
        return Promise.resolve({ data: { total_income: 0, total_expense: 0, balance: 0 } });
      return Promise.resolve(mockListResponse([]));
    });
    vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

    const { result } = renderHook(() => useTransactions(EMPTY_FILTERS));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    await act(async () => {
      await result.current.createTransaction({
        description: 'Novo',
        amount: 10,
        type: 'expense',
        category: 'Outros',
      });
    });
    expect(api.post).toHaveBeenCalledWith('/transactions/', {
      description: 'Novo',
      amount: 10,
      type: 'expense',
      category: 'Outros',
    });
  });
});
