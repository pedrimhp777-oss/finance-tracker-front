import React, { useRef, useState } from 'react';
import { Calendar, Pencil, Plus, X } from 'lucide-react';
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

/** Converte a data ISO da API para dd/mm/aaaa no fuso local do usuário. */
const toLocalDateInput = (isoDate: string): string => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

/** Máscara progressiva de digitação: dd/mm/aaaa (somente dígitos). */
const maskDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2)];
  if (digits.length > 2) parts.push(digits.slice(2, 4));
  if (digits.length > 4) parts.push(digits.slice(4, 8));
  return parts.filter(Boolean).join('/');
};

interface ParsedDateInput {
  iso: string;
  error?: string;
}

/** Valida dd/mm/aaaa completo e converte para ISO UTC (meio-dia local,
 * preservando o dia escolhido em qualquer fuso). Recusa datas futuras. */
const parseDateInput = (value: string): ParsedDateInput | null => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return { iso: '' }; // campo vazio: usa hoje
  if (digits.length !== 8) {
    return { iso: '', error: 'Complete a data no formato DD/MM/AAAA.' };
  }
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const parsed = new Date(year, month - 1, day, 12, 0, 0);
  const validCalendarDate =
    year >= 1900 &&
    month >= 1 && month <= 12 &&
    day >= 1 && day <= 31 &&
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day;
  if (!validCalendarDate) {
    return { iso: '', error: 'Informe uma data válida.' };
  }
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (parsed > today) {
    return { iso: '', error: 'A data não pode estar no futuro.' };
  }
  return { iso: parsed.toISOString() };
};

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
  // Data opcional em dd/mm/aaaa (digitação). Vazia = usa a data de hoje.
  const [dateInput, setDateInput] = useState(() => editing ? toLocalDateInput(editing.date) : '');
  const [dateError, setDateError] = useState('');
  const nativeDateRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number.parseFloat(amount);
    if (!description.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    const parsedDate = parseDateInput(dateInput);
    if (parsedDate?.error) {
      setDateError(parsedDate.error);
      return;
    }
    setDateError('');

    await onSave({
      description: description.trim(),
      amount: parsedAmount,
      type,
      category,
      ...(parsedDate?.iso ? { date: parsedDate.iso } : {}),
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

        <div>
          <label htmlFor="tx-date" className={labelClass}>
            Data <span className="text-slate-500">(opcional)</span>
          </label>
          <div className="relative">
            <input
              id="tx-date"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              value={dateInput}
              onChange={(e) => {
                setDateInput(maskDateInput(e.target.value));
                if (dateError) setDateError('');
              }}
              className={`${inputClass} pr-10 placeholder:text-slate-500`}
              aria-invalid={dateError ? true : undefined}
            />
            {/* Calendário nativo acessível pelo ícone: preenche a máscara. */}
            <input
              ref={nativeDateRef}
              id="tx-date-native"
              type="date"
              tabIndex={-1}
              aria-hidden="true"
              value={''}
              onChange={(e) => {
                if (!e.target.value) return;
                const [y, m, d] = e.target.value.split('-');
                setDateInput(`${d}/${m}/${y}`);
                if (dateError) setDateError('');
              }}
              className="sr-only"
            />
            <button
              type="button"
              aria-label="Abrir calendário"
              onClick={() => {
                const native = nativeDateRef.current;
                if (!native) return;
                try {
                  native.showPicker();
                } catch {
                  native.focus();
                  native.click();
                }
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white hover:text-emerald-400 transition cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
          {dateError ? (
            <p className="text-xs text-red-400 mt-1">{dateError}</p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">
              Deixe vazio para usar a data de hoje.
            </p>
          )}
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
