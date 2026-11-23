// `TransactionCategory` deriva desta lista, então `CATEGORIES` não pode
// referenciar o tipo (seria autorreferência circular).
import type { TransactionCategory } from '../types/finance';

/**
 * Fonte única das categorias.
 *
 * Antes a lista existia em três lugares (o tipo em `types`, `TransactionForm` e
 * `FinanceFilters`) e as cores do gráfico vinham de `COLORS[index % 6]`: uma
 * categoria nova exigia editar três arquivos e, esquecido um, o formulário
 * deixava de oferecer a categoria que a API aceita.
 *
 * A cor também era escolhida pela **posição** da fatia — a mesma categoria
 * mudava de cor conforme o total reordenava o gráfico. Agora a cor é da
 * categoria.
 */

export const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Trabalho',
  'Outros',
] as const;

/**
 * Uma cor por categoria, todas distintas.
 *
 * `Record<TransactionCategory, string>` faz o TypeScript recusar a compilação
 * se alguém adicionar uma categoria ao tipo sem definir a cor — a garantia é do
 * compilador, não de um teste que pode ser esquecido.
 */
export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  Alimentação: '#EF4444', // vermelho
  Transporte: '#F59E0B', // âmbar
  Moradia: '#10B981', // esmeralda
  Saúde: '#3B82F6', // azul
  Educação: '#8B5CF6', // violeta
  Lazer: '#EC4899', // rosa
  Trabalho: '#06B6D4', // ciano
  Outros: '#94A3B8', // cinza
};

/** Cor de uma categoria; cinza para valor que não está na lista. */
export const categoryColor = (categoria: string): string =>
  CATEGORY_COLORS[categoria as TransactionCategory] ?? CATEGORY_COLORS.Outros;

/**
 * Acrescenta a cor de cada categoria a uma lista de totais.
 *
 * Existe separado do componente para poder ser testado sem renderizar o
 * gráfico: era aqui que a cor vinha da posição (`COLORS[index % 6]`) e mudava
 * quando o total reordenava as fatias.
 */
export const comCoresPorCategoria = <T extends { category: string }>(
  linhas: readonly T[],
): Array<T & { fill: string }> =>
  linhas.map((linha) => ({ ...linha, fill: categoryColor(linha.category) }));
