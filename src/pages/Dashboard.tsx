import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { Transaction, Summary, TransactionCategory, TransactionType } from '../types/finance';
import { LogOut, TrendingUp, TrendingDown, DollarSign, Plus, Trash2, Download, Pencil, X, AlertTriangle } from 'lucide-react';
import { FinanceCharts } from '../components/FinanceCharts';
import { FinanceFilters } from '../components/FinanceFilters';
import toast, { Toaster } from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ total_income: 0, total_expense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);

  // Estados do formulário
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('income');
  const [category, setCategory] = useState<TransactionCategory>('Outros');

  // Estados de Edição e Modal de Deleção
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const fetchData = async () => {
    try {
      const [transRes, summaryRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/transactions/summary')
      ]);
      setTransactions(transRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      toast.error("Erro ao carregar os dados financeiros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => t.category)));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? t.category === selectedCategory : true;

      if (!t.date) return matchesSearch && matchesCategory;

      const tDate = new Date(t.date);
      const matchesMonth = selectedMonth ? tDate.getMonth() + 1 === Number(selectedMonth) : true;
      const matchesYear = selectedYear ? tDate.getFullYear() === Number(selectedYear) : true;

      return matchesSearch && matchesCategory && matchesMonth && matchesYear;
    });
  }, [transactions, searchTerm, selectedCategory, selectedMonth, selectedYear]);

  const handleEditClick = (item: Transaction) => {
    setEditingId(item.id);
    setDescription(item.description);
    setAmount(String(item.amount));
    setType(item.type);
    setCategory(item.category as TransactionCategory);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDescription('');
    setAmount('');
    setType('income');
    setCategory('Outros');
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const payload = {
      description,
      amount: parseFloat(amount),
      type,
      category
    };

    try {
      if (editingId !== null) {
        await api.put(`/transactions/${editingId}`, payload);
        toast.success("Transação atualizada com sucesso!");
      } else {
        await api.post('/transactions', payload);
        toast.success("Transação adicionada!");
      }
      handleCancelEdit();
      fetchData();
    } catch (err) {
      toast.error(editingId !== null ? "Erro ao atualizar transação." : "Erro ao adicionar transação.");
    }
  };

  const confirmDeleteTransaction = async () => {
    if (deletingId === null) return;

    try {
      await api.delete(`/transactions/${deletingId}`);
      toast.success("Transação removida.");
      if (editingId === deletingId) handleCancelEdit();
      fetchData();
    } catch (err) {
      toast.error("Erro ao remover transação.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/transactions/export/excel', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_financeiro_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Relatório Excel baixado!");
    } catch (err) {
      toast.error("Erro ao exportar relatório em Excel.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      {/* Componente de Toasts */}
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

        {/* Resumo */}
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

        {/* Barra de Filtros */}
        <FinanceFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          categories={categories}
        />

        {/* Gráficos */}
        <FinanceCharts transactions={filteredTransactions} />

        {/* Conteúdo Principal (Formulário + Tabela) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formulário */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-fit">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingId !== null ? 'Editar Transação' : 'Nova Transação'}
              </h3>
              {editingId !== null && (
                <button
                  onClick={handleCancelEdit}
                  className="text-slate-400 hover:text-white text-xs flex items-center gap-1 bg-slate-700 px-2 py-1 rounded transition"
                >
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Salário, Mercado"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TransactionType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="income">Entrada</option>
                    <option value="expense">Saída</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Alimentação">Alimentação</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Moradia">Moradia</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Educação">Educação</option>
                    <option value="Lazer">Lazer</option>
                    <option value="Trabalho">Trabalho</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                  editingId !== null
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                }`}
              >
                {editingId !== null ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId !== null ? 'Salvar Alterações' : 'Adicionar'}
              </button>
            </form>
          </div>

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
            ) : filteredTransactions.length === 0 ? (
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
                    {filteredTransactions.map((item) => (
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
                              onClick={() => handleEditClick(item)}
                              className="text-slate-400 hover:text-blue-400 p-1 transition cursor-pointer"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(item.id)}
                              className="text-slate-500 hover:text-red-400 p-1 transition cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Modal de Confirmação de Deleção */}
      {deletingId !== null && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Excluir Transação?</h4>
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