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
