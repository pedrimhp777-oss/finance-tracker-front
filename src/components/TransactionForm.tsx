import React, { useState } from 'react';
import { Pencil, Plus, X } from 'lucide-react';
import type {
  Transaction,
  TransactionCategory,
  TransactionPayload,
  TransactionType,
} from '../types/finance';

const CATEGORIES: TransactionCategory[] = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Trabalho',
  'Outros',
];

interface TransactionFormProps {
  editing: Transaction | null;
  saving: boolean;
  onSave: (payload: TransactionPayload) => Promise<void>;
  onCancelEdit: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  editing,
  saving,
  onSave,
  onCancelEdit,
}) => {
  // Inicializa o formulário a partir do item em edição.
  // O Dashboard remonta o componente (key) ao trocar de edição para criação.
  const [description, setDescription] = useState(editing?.description ?? '');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [type, setType] = useState<TransactionType>(editing?.type ?? 'income');
  const [category, setCategory] = useState<TransactionCategory>(editing?.category ?? 'Outros');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number.parseFloat(amount);
    if (!description.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    await onSave({
      description: description.trim(),
      amount: parsedAmount,
      type,
      category,
    });
  };

  const inputClass =
    'w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-60';
  const labelClass = 'block text-xs font-medium text-slate-400 mb-1';
  const isEditing = editing !== null;

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-fit">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">
          {isEditing ? 'Editar Transação' : 'Nova Transação'}
        </h3>
        {isEditing && (
          <button
            onClick={onCancelEdit}
            className="text-slate-400 hover:text-white text-xs flex items-center gap-1 bg-slate-700 px-2 py-1 rounded transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Cancelar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tx-description" className={labelClass}>
            Descrição
          </label>
          <input
            id="tx-description"
            type="text"
            required
            maxLength={240}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Salário, Mercado"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="tx-amount" className={labelClass}>
            Valor (R$)
          </label>
          <input
            id="tx-amount"
            type="number"
            step="0.01"
            min="0.01"
            max="9999999999.99"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="tx-type" className={labelClass}>
              Tipo
            </label>
            <select
              id="tx-type"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="income">Entrada</option>
              <option value="expense">Saída</option>
            </select>
          </div>

          <div>
            <label htmlFor="tx-category" className={labelClass}>
              Categoria
            </label>
            <select
              id="tx-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
              className={`${inputClass} cursor-pointer`}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className={`w-full font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
            isEditing
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
          }`}
        >
          {isEditing ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {saving
            ? 'Salvando...'
            : isEditing
              ? 'Salvar Alterações'
              : 'Adicionar'}
        </button>
      </form>
    </div>
  );
};
