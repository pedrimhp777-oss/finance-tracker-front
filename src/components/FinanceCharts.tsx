import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { Summary } from '../types/finance';
import type { CategoryTotal } from '../hooks/useTransactions';

interface FinanceChartsProps {
  /** Agregação server-side de despesas por categoria (todas as filtradas). */
  expensesByCategory: CategoryTotal[];
  /** Resumo autoritativo do servidor (usado no gráfico de barras). */
  summary: Summary;
}

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

export function FinanceCharts({ expensesByCategory, summary }: FinanceChartsProps) {
  const pieData = expensesByCategory.map((row) => ({
    name: row.category,
    value: row.total,
  }));

  const barData = [
    { name: 'Entradas', valor: summary.total_income, fill: '#10B981' },
    { name: 'Saídas', valor: summary.total_expense, fill: '#EF4444' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
      {/* Gráfico de Rosca */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-base font-semibold text-white mb-4">Despesas por Categoria</h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                stroke="#1e293b"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `R$ ${Number(value ?? 0).toFixed(2)}`}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Legend wrapperStyle={{ color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-400 text-sm text-center py-16">Nenhuma despesa registrada para exibir.</p>
        )}
      </div>

      {/* Gráfico de Barras */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-base font-semibold text-white mb-4">Entradas vs Saídas</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData}>
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              formatter={(value) => `R$ ${Number(value ?? 0).toFixed(2)}`}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Bar dataKey="valor" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}