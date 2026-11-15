import React, { Suspense, lazy, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, TrendingUp, TrendingDown, DollarSign, Trash2, Download, Pencil, AlertTriangle } from 'lucide-react';
import { TransactionForm } from '../components/TransactionForm';
import { useTransactions } from '../hooks/useTransactions';
import { getApiErrorMessage } from '../services/api';
import type { Transaction, TransactionFilters, TransactionPayload } from '../types/finance';
import toast, { Toaster } from 'react-hot-toast';

const FinanceFilters = lazy(() =>
  import('../components/FinanceFilters').then((m) => ({ default: m.FinanceFilters })),
);
const FinanceCharts = lazy(() =>
  import('../components/FinanceCharts').then((m) => ({ default: m.FinanceCharts })),
);

export const Dashboard: React.FC = () => {
  const { logout } = useAuth();

  // Filtros aplicados no servidor (mesmos parâmetros para lista, resumo e exportação)
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    category: '',
    month: '',
    year: '',
    day: '',
  });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const {
    transactions,
    summary,
    expensesByCategory,
    loading,
    hasMore,
    loadMore,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    exportExcel,
  } = useTransactions(filters);

  // Ano mais antigo do histórico carregado: alimenta a lista de anos do
  // filtro (derivada dos dados reais, sem lista arbitrária).
  const minYear = useMemo(() => {
    if (transactions.length === 0) return new Date().getFullYear();
    return transactions.reduce((min, t) => {
      const y = new Date(t.date).getFullYear();
      return Number.isFinite(y) && y < min ? y : min;
    }, new Date().getFullYear());
  }, [transactions]);

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      // O dia só faz sentido com mês e ano; se o período mudar e o dia
      // escolhido não existir nele, limpa o dia.
      if (key === 'month' || key === 'year') {
        const m = Number(next.month);
        const y = Number(next.year);
        if (next.month && next.year && next.day) {
          const maxDay = new Date(y, m, 0).getDate();
          if (Number(next.day) > maxDay) next.day = '';
        } else if (!next.month || !next.year) {
          next.day = '';
        }
      }
      return next;
    });
  };

  const handleSaveTransaction = async (payload: TransactionPayload) => {
    setSaving(true);
    try {
      if (editing) {
        await updateTransaction(editing.id, payload);
      } else {
        await createTransaction(payload);
      }
      setEditing(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, editing ? 'Erro ao atualizar transação.' : 'Erro ao adicionar transação.'));
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportExcel();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Erro ao exportar relatório em Excel.'));
    }
  };

  const confirmDeleteTransaction = async () => {
    if (deletingId === null) return;
    try {
      await deleteTransaction(deletingId);
      if (editing?.id === deletingId) setEditing(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Erro ao remover transação.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
          },
        }}
      />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Topbar */}
        <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div>
            <h1 className="text-2xl font-bold text-white">Finance Tracker</h1>
            <p className="text-slate-400 text-sm">Painel de Controle Financeiro</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-sm transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>

        {/* Resumo (autoritativo, calculado no servidor com os mesmos filtros) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-sm">Entradas</span>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-emerald-400">R$ {summary.total_income.toFixed(2)}</h2>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-sm">Saídas</span>
              <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-red-400">R$ {summary.total_expense.toFixed(2)}</h2>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-sm">Saldo Total</span>
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <h2 className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              R$ {summary.balance.toFixed(2)}
            </h2>
          </div>
        </div>

        {/* Barra de Filtros (aplicados no servidor) */}
        <Suspense fallback={null}>
          <FinanceFilters
          searchTerm={filters.search ?? ''}
          setSearchTerm={(v) => handleFilterChange('search', v)}
          selectedCategory={filters.category ?? ''}
          setSelectedCategory={(v) => handleFilterChange('category', v)}
          selectedMonth={filters.month ?? ''}
          setSelectedMonth={(v) => handleFilterChange('month', v)}
          selectedYear={filters.year ?? ''}
          setSelectedYear={(v) => handleFilterChange('year', v)}
          selectedDay={filters.day ?? ''}
          setSelectedDay={(v) => handleFilterChange('day', v)}
          minYear={minYear}
        />
        </Suspense>

        {/* Gráficos (carregados sob demanda; agregação server-side) */}
        <Suspense fallback={<div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-slate-400 text-sm text-center">Carregando gráficos...</div>}>
          <FinanceCharts
            expensesByCategory={expensesByCategory}
            summary={summary}
          />
        </Suspense>

        {/* Conteúdo Principal (Formulário + Tabela) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TransactionForm
            key={editing?.id ?? 'new'}
            editing={editing}
            saving={saving}
            onSave={handleSaveTransaction}
            onCancelEdit={() => setEditing(null)}
          />

          {/* Tabela de Transações */}
          <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Histórico de Transações</h3>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg border border-slate-600 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" /> Exportar Excel
              </button>
            </div>

            {loading ? (
              <p className="text-slate-400 text-sm text-center py-8">Carregando...</p>
            ) : transactions.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">Nenhuma transação encontrada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-slate-700 text-slate-400">
                    <tr>
                      <th className="pb-3">Descrição</th>
                      <th className="pb-3">Categoria</th>
                      <th className="pb-3">Data</th>
                      <th className="pb-3">Valor</th>
                      <th className="pb-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {transactions.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-700/30">
                        <td className="py-3 font-medium text-white">{item.description}</td>
                        <td className="py-3">
                          <span className="bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-md">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400 text-xs">
                          {item.date ? new Date(item.date).toLocaleDateString('pt-BR') : 'N/A'}
                        </td>
                        <td className={`py-3 font-semibold ${item.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {item.type === 'income' ? '+' : '-'} R$ {item.amount.toFixed(2)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditing(item)}
                              className="text-slate-400 hover:text-blue-400 p-1 transition cursor-pointer"
                              title="Editar"
                              aria-label={`Editar ${item.description}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(item.id)}
                              className="text-slate-500 hover:text-red-400 p-1 transition cursor-pointer"
                              title="Excluir"
                              aria-label={`Excluir ${item.description}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {hasMore && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => void loadMore()}
                      className="text-slate-400 hover:text-white text-sm underline underline-offset-4 transition cursor-pointer"
                    >
                      Carregar mais transações
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Deleção */}
      {deletingId !== null && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 id="delete-dialog-title" className="text-lg font-bold text-white">Excluir Transação?</h4>
            </div>
            <p className="text-slate-400 text-sm">
              Esta ação é permanente e não poderá ser desfeita no seu histórico financeiro.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteTransaction}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
