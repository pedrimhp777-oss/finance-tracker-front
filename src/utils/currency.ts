/**
 * Formatação monetária em Real.
 *
 * Centralizado aqui porque a aplicação inteira usa BRL: `toFixed(2)` produzia
 * "R$ 1234.56" (separador de milhar ausente e ponto decimal no lugar da
 * vírgula), ilegível para quem fala português e inconsistente com o Excel
 * exportado, que já sai em formato brasileiro.
 */

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Notação compacta (ex.: "R$ 1,2 mi") para eixos de gráfico, onde o valor
 * completo estoura a largura disponível. */
const BRL_COMPACT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** "R$ 1.234,56". Valores não finitos viram "R$ 0,00" em vez de "R$ NaN". */
export function formatCurrency(value: number): string {
  const parsed = Number(value);
  return BRL.format(Number.isFinite(parsed) ? parsed : 0);
}

/** "R$ 1,2 mi" — usado apenas em eixos, nunca em valores exatos. */
export function formatCurrencyCompact(value: number): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return BRL.format(0);
  // Abaixo de mil a notação compacta não abrevia nada e ainda perde centavos
  // ("R$ 50,0", e o sufixo varia conforme a versão de ICU). Nessa faixa o
  // valor exato é mais útil como marcação de eixo.
  if (Math.abs(parsed) < 1000) return BRL.format(parsed);
  return BRL_COMPACT.format(parsed);
}
