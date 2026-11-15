import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionForm } from '../components/TransactionForm';
import type { Transaction } from '../types/finance';

const tx: Transaction = {
  id: 1,
  description: 'Salário',
  amount: 3000,
  type: 'income',
  category: 'Trabalho',
  date: '2026-11-14T12:00:00Z',
};

describe('TransactionForm', () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onCancelEdit = vi.fn();

  beforeEach(() => {
    onSave.mockClear();
    onCancelEdit.mockClear();
  });

  it('renderiza o modo criação', () => {
    render(<TransactionForm editing={null} saving={false} onSave={onSave} onCancelEdit={onCancelEdit} />);
    expect(screen.getByText('Nova Transação')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /adicionar/i })).toBeInTheDocument();
  });

  it('preenche os campos no modo edição', () => {
    render(
      <TransactionForm key="edit-1" editing={tx} saving={false} onSave={onSave} onCancelEdit={onCancelEdit} />,
    );
    expect(screen.getByText('Editar Transação')).toBeInTheDocument();
    expect(screen.getByLabelText(/descrição/i)).toHaveValue('Salário');
    expect(screen.getByLabelText(/valor/i)).toHaveValue(3000);
  });

  it('envia o payload com os dados informados', async () => {
    const user = userEvent.setup();
    render(<TransactionForm editing={null} saving={false} onSave={onSave} onCancelEdit={onCancelEdit} />);

    await user.type(screen.getByLabelText(/descrição/i), 'Mercado');
    await user.type(screen.getByLabelText(/valor/i), '150.75');
    await user.selectOptions(screen.getByLabelText(/tipo/i), 'expense');
    await user.selectOptions(screen.getByLabelText(/categoria/i), 'Alimentação');
    await user.click(screen.getByRole('button', { name: /adicionar/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        description: 'Mercado',
        amount: 150.75,
        type: 'expense',
        category: 'Alimentação',
      });
    });
  });

  it('envia date em ISO quando o usuário digita a data', async () => {
    const user = userEvent.setup();
    render(<TransactionForm editing={null} saving={false} onSave={onSave} onCancelEdit={onCancelEdit} />);

    await user.type(screen.getByLabelText(/descrição/i), 'Salário de março');
    await user.type(screen.getByLabelText(/valor/i), '3000');
    // Digita só números: a máscara completa com as barras.
    await user.type(screen.getByLabelText(/data/i), '15032026');
    expect(screen.getByLabelText(/data/i)).toHaveValue('15/03/2026');
    await user.click(screen.getByRole('button', { name: /adicionar/i }));

    await waitFor(() => {
      const call = onSave.mock.calls[0][0];
      expect(call.date).toBeDefined();
      // Meio-dia local convertido para UTC preserva o dia 15/03,
      // independentemente do fuso do usuário.
      const d = new Date(call.date);
      expect(d.toISOString().startsWith('2026-03-15T')).toBe(true);
    });
  });

  it('bloqueia envio com data inválida e mostra o erro', async () => {
    const user = userEvent.setup();
    render(<TransactionForm editing={null} saving={false} onSave={onSave} onCancelEdit={onCancelEdit} />);

    await user.type(screen.getByLabelText(/descrição/i), 'X');
    await user.type(screen.getByLabelText(/valor/i), '10');
    await user.type(screen.getByLabelText(/data/i), '31022026'); // 31/02 não existe
    await user.click(screen.getByRole('button', { name: /adicionar/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/informe uma data válida/i)).toBeInTheDocument();
  });

  it('tem o botão de calendário acessível', () => {
    render(<TransactionForm editing={null} saving={false} onSave={onSave} onCancelEdit={onCancelEdit} />);
    expect(screen.getByRole('button', { name: /abrir calendário/i })).toBeInTheDocument();
  });

  it('no modo edição preenche a data existente no formato dd/mm/aaaa', () => {
    render(
      <TransactionForm key="edit-1" editing={tx} saving={false} onSave={onSave} onCancelEdit={onCancelEdit} />,
    );
    const d = new Date(tx.date);
    const pad = (n: number) => String(n).padStart(2, '0');
    const expected = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    expect(screen.getByLabelText(/data/i)).toHaveValue(expected);
  });

  it('não envia com valor inválido', async () => {
    const user = userEvent.setup();
    render(<TransactionForm editing={null} saving={false} onSave={onSave} onCancelEdit={onCancelEdit} />);

    fireEvent.input(screen.getByLabelText(/descrição/i), { target: { value: 'X' } });
    await user.type(screen.getByLabelText(/valor/i), '0');
    await user.click(screen.getByRole('button', { name: /adicionar/i }));

    expect(onSave).not.toHaveBeenCalled();
  });

  it('mostra botão desabilitado enquanto salva', () => {
    render(<TransactionForm editing={null} saving={true} onSave={onSave} onCancelEdit={onCancelEdit} />);
    expect(screen.getByRole('button', { name: /salvando/i })).toBeDisabled();
  });
});
