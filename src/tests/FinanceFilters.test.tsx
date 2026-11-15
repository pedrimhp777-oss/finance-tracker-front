import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FinanceFilters, daysInSelectedMonth } from '../components/FinanceFilters';

const base = {
  searchTerm: '',
  setSearchTerm: vi.fn(),
  selectedCategory: '',
  setSelectedCategory: vi.fn(),
  selectedMonth: '',
  setSelectedMonth: vi.fn(),
  selectedYear: '',
  setSelectedYear: vi.fn(),
  selectedDay: '',
  setSelectedDay: vi.fn(),
};

describe('FinanceFilters', () => {
  it('lista anos a partir do histórico do usuário (mais recente primeiro)', () => {
    render(<FinanceFilters {...base} minYear={2021} />);
    const yearSelect = screen.getByRole('combobox', { name: 'Filtrar por ano' }) as HTMLSelectElement;
    const options = Array.from(yearSelect.options).map((o) => o.value);
    const currentYear = new Date().getFullYear();
    // Todos os anos de 2021 até currentYear + 1, do mais recente ao mais antigo.
    const expected: string[] = [];
    for (let y = currentYear + 1; y >= 2021; y--) expected.push(String(y));
    expect(options).toEqual(['', ...expected]);
  });

  it('desabilita o filtro de dia até mês e ano estarem escolhidos', () => {
    render(<FinanceFilters {...base} minYear={2026} />);
    expect(screen.getByTitle(/escolha o mês e o ano/i)).toBeDisabled();
  });

  it('habilita o dia com mês+ano e mostra os dias corretos do mês', () => {
    render(
      <FinanceFilters
        {...base}
        selectedMonth="2"
        selectedYear="2026"
        minYear={2026}
      />,
    );
    const day = screen.getByRole('combobox', { name: 'Filtrar por dia' }) as HTMLSelectElement;
    expect(day).not.toBeDisabled();
    const dayValues = Array.from(day.options).map((o) => o.value);
    expect(dayValues).toContain('28'); // fevereiro de 2026 tem 28 dias
    expect(dayValues).not.toContain('29');
  });

  it('emite evento ao mudar o dia', async () => {
    const user = userEvent.setup();
    render(
      <FinanceFilters
        {...base}
        selectedMonth="3"
        selectedYear="2026"
        minYear={2026}
      />,
    );
    const day = screen.getByRole('combobox', { name: 'Filtrar por dia' }) as HTMLSelectElement;
    await user.selectOptions(day, '15');
    expect(base.setSelectedDay).toHaveBeenCalledWith('15');
  });

  describe('daysInSelectedMonth', () => {
    it('usa os dias reais quando mês e ano estão completos', () => {
      expect(daysInSelectedMonth('2', '2026')).toBe(28);
      expect(daysInSelectedMonth('2', '2024')).toBe(29); // bissexto
      expect(daysInSelectedMonth('1', '2026')).toBe(31);
      expect(daysInSelectedMonth('4', '2026')).toBe(30);
    });

    it('fallback 31 quando o período está incompleto', () => {
      expect(daysInSelectedMonth('', '2026')).toBe(31);
      expect(daysInSelectedMonth('2', '')).toBe(31);
    });
  });
});
