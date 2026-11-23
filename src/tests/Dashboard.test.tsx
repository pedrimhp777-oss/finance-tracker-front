import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ logout: vi.fn(), sessionExpired: false }),
}));

// Componentes pesados (lazy) não interessam para estes cenários.
vi.mock('../components/FinanceFilters', () => ({ FinanceFilters: () => null }));
vi.mock('../components/FinanceCharts', () => ({ FinanceCharts: () => null }));

import { api } from '../services/api';
import { Dashboard } from '../pages/Dashboard';

const mockedGet = vi.mocked(api.get);
const mockedPost = vi.mocked(api.post);

function row(id: number) {
  return {
    id,
    description: `T${id}`,
    amount: '10.00',
    type: 'expense' as const,
    category: 'Outros' as const,
    date: '2026-03-01T15:00:00Z',
  };
}

/** Mocka lista/resumo/categorias; `list` recebe a config de cada página. */
function mockApi(list: (config?: { params?: { skip?: number } }) => Promise<unknown>) {
  mockedGet.mockImplementation(((url: string, config?: { params?: { skip?: number } }) => {
    if (url === '/transactions/categories')
      return Promise.resolve({ data: [{ category: 'Outros', total: '10.00' }] });
    if (url === '/transactions/summary')
      return Promise.resolve({
        data: { total_income: 100, total_expense: 10, balance: 90 },
      });
    return list(config);
  }) as typeof api.get);
}

describe('Dashboard', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    localStorage.clear();
  });

  it('limpa o formulário depois de criar uma transação (F1)', async () => {
    mockApi(() => Promise.resolve({ data: [row(1)] }));
    mockedPost.mockResolvedValue({ data: {} } as never);

    render(<Dashboard />);
    await screen.findByText('T1', undefined, { timeout: 3000 });

    const description = screen.getByLabelText('Descrição');
    const amount = screen.getByLabelText('Valor (R$)') as HTMLInputElement;

    fireEvent.change(description, { target: { value: 'Mercado' } });
    fireEvent.change(amount, { target: { value: '50' } });
    expect(description).toHaveValue('Mercado');

    fireEvent.click(screen.getByRole('button', { name: /Adicionar/i }));

    // Sem a remontagem por `formSession`, os campos continuavam preenchidos e
    // um segundo clique duplicava o lançamento.
    await waitFor(() => expect(screen.getByLabelText('Descrição')).toHaveValue(''));
    expect((screen.getByLabelText('Valor (R$)') as HTMLInputElement).value).toBe('');
  });

  it('mantém a tabela visível ao carregar a próxima página (F2)', async () => {
    let releaseNextPage: (value: unknown) => void = () => {};
    const nextPage = new Promise((resolve) => {
      releaseNextPage = resolve;
    });

    mockApi((config) => {
      const skip = config?.params?.skip ?? 0;
      if (skip > 0) return nextPage;
      return Promise.resolve({
        data: Array.from({ length: 100 }, (_, index) => row(index + 1)),
      });
    });

    render(<Dashboard />);
    await screen.findByText('T1', undefined, { timeout: 3000 });

    fireEvent.click(screen.getByRole('button', { name: /Carregar mais transações/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Carregando mais/i })).toBeDisabled(),
    );
    // A tabela inteira continua na tela: antes o "Carregando..." a substituía.
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    expect(screen.getByText('T1')).toBeInTheDocument();

    await act(async () => {
      releaseNextPage({ data: [row(101)] });
    });
    await waitFor(() => expect(screen.getByText('T101')).toBeInTheDocument());
  });

  it('mostra os valores em Real com vírgula decimal (F4)', async () => {
    mockApi(() => Promise.resolve({ data: [row(1)] }));

    render(<Dashboard />);
    await screen.findByText('T1', undefined, { timeout: 3000 });

    // R$ 100,00 / R$ 10,00 / R$ 90,00 em vez de "R$ 100.00".
    expect(screen.getByText(/R\$\s?100,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?90,00/)).toBeInTheDocument();
    expect(screen.getByText(/-\s?R\$\s?10,00/)).toBeInTheDocument();
  });

  it('fecha o modal de exclusão com Esc (F10)', async () => {
    mockApi(() => Promise.resolve({ data: [row(1)] }));
    render(<Dashboard />);
    await screen.findByText('T1', undefined, { timeout: 3000 });

    fireEvent.click(screen.getByLabelText('Excluir T1'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('mantém o foco dentro do modal e começa pelo botão seguro (F10)', async () => {
    mockApi(() => Promise.resolve({ data: [row(1)] }));
    render(<Dashboard />);
    await screen.findByText('T1', undefined, { timeout: 3000 });

    fireEvent.click(screen.getByLabelText('Excluir T1'));

    // Abre no "Cancelar", não no destrutivo.
    await waitFor(() => expect(screen.getByText('Cancelar')).toHaveFocus());

    const destrutivo = screen.getByText('Sim, Excluir');
    destrutivo.focus();

    // Tab no último elemento volta para o primeiro: o foco não escapa.
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByText('Cancelar')).toHaveFocus();

    // Shift+Tab no primeiro vai para o último.
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(destrutivo).toHaveFocus();
  });
});
