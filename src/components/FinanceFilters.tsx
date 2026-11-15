import { Search, Filter } from 'lucide-react';
import type { TransactionCategory } from '../types/finance';

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

interface FinanceFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  selectedDay: string;
  setSelectedDay: (value: string) => void;
  /** Ano mais antigo presente no histórico do usuário (deriva a lista). */
  minYear: number;
}

/** Dias do mês selecionado (29..31 quando mês/ano incompletos). */
export function daysInSelectedMonth(month: string, year: string): number {
  const m = Number(month);
  const y = Number(year);
  if (m >= 1 && m <= 12 && y >= 1900) {
    // Dia 0 do mês seguinte = último dia do mês escolhido.
    return new Date(y, m, 0).getDate();
  }
  return 31;
}

export function FinanceFilters({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedDay,
  setSelectedDay,
  minYear,
}: FinanceFiltersProps) {
  const months = [
    { value: '', label: 'Todos os meses' },
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const currentYear = new Date().getFullYear();
  // Lista de anos derivada do histórico do usuário (mais recente primeiro),
  // sempre incluindo o próximo ano para lançamentos antecipados.
  const lastYear = Math.max(currentYear + 1, minYear);
  const years: string[] = [];
  for (let y = lastYear; y >= Math.min(minYear, currentYear); y--) {
    years.push(String(y));
  }

  const dayEnabled = selectedMonth !== '' && selectedYear !== '';
  const maxDay = daysInSelectedMonth(selectedMonth, selectedYear);
  const selectClass =
    'px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
      {/* Busca por Descrição */}
      <div className="relative w-full md:w-1/3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          id="filter-search"
          name="search"
          type="text"
          autoComplete="off"
          placeholder="Buscar transação..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Selects de Filtros */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <Filter className="text-slate-400 w-4 h-4 hidden md:block" />

        {/* Categoria */}
        <select
          id="filter-category"
          name="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filtrar por categoria"
          className={selectClass}
        >
          <option value="">Todas as Categorias</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Mês */}
        <select
          id="filter-month"
          name="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          aria-label="Filtrar por mês"
          className={selectClass}
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        {/* Ano (histórico completo do usuário) */}
        <select
          id="filter-year"
          name="year"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          aria-label="Filtrar por ano"
          className={selectClass}
        >
          <option value="">Todos os Anos</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {/* Dia (habilitado apenas com mês e ano escolhidos) */}
        <select
          id="filter-day"
          name="day"
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          disabled={!dayEnabled}
          aria-label="Filtrar por dia"
          title={
            dayEnabled
              ? undefined
              : 'Escolha o mês e o ano para filtrar por dia'
          }
          className={selectClass}
        >
          <option value="">Todos os dias</option>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <option key={d} value={String(d)}>
              {String(d).padStart(2, '0')}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
