import { describe, expect, it } from 'vitest';
import { formatCurrency, formatCurrencyCompact } from '../utils/currency';

/** O Intl usa espaço não separável (U+00A0); normalizamos para comparar. */
const plain = (value: string) => value.replace(/\u00a0/g, ' ');

describe('formatCurrency', () => {
  it('usa vírgula decimal e ponto de milhar (antes saía 1234.56)', () => {
    expect(plain(formatCurrency(1234.56))).toBe('R$ 1.234,56');
  });

  it('agrupa valores grandes sem perder centavos', () => {
    expect(plain(formatCurrency(30005501))).toBe('R$ 30.005.501,00');
  });

  it('sempre mostra duas casas decimais', () => {
    expect(plain(formatCurrency(0))).toBe('R$ 0,00');
    expect(plain(formatCurrency(0.5))).toBe('R$ 0,50');
  });

  it('formata negativos como o saldo devedor', () => {
    expect(plain(formatCurrency(-12.3))).toBe('-R$ 12,30');
  });

  it('não vaza NaN para a tela', () => {
    expect(plain(formatCurrency(Number.NaN))).toBe('R$ 0,00');
    expect(plain(formatCurrency(Number.POSITIVE_INFINITY))).toBe('R$ 0,00');
  });
});

describe('formatCurrencyCompact', () => {
  it('abrevia valores para o eixo do gráfico', () => {
    // "R$ 1,2 mi" cabe onde "R$ 1.200.000,00" estouraria a largura do eixo.
    expect(plain(formatCurrencyCompact(1_200_000))).toBe('R$ 1,2 mi');
  });

  it('não abrevia valores que não ganham nada com isso', () => {
    // Notação compacta varia entre versões de ICU ("R$ 50" vs "R$ 50,0");
    // abaixo de mil o valor exato é mais útil — e estável entre ambientes.
    expect(plain(formatCurrencyCompact(50))).toBe('R$ 50,00');
    expect(plain(formatCurrencyCompact(0))).toBe('R$ 0,00');
    expect(plain(formatCurrencyCompact(999.99))).toBe('R$ 999,99');
  });
});
