import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  CATEGORY_COLORS,
  categoryColor,
  comCoresPorCategoria,
} from '../constants/categories';

describe('CATEGORIES', () => {
  it('não tem duplicatas', () => {
    expect(new Set(CATEGORIES).size).toBe(CATEGORIES.length);
  });

  it('mantém as 8 categorias que a API aceita', () => {
    // A lista do backend é o enum `TransactionCategory` em `app/schemas.py`
    // (outro repositório, sem como compartilhar o código). Se ela ganhar uma
    // categoria, este teste falha em vez de o formulário ficar sem a opção.
    expect([...CATEGORIES]).toEqual([
      'Alimentação',
      'Transporte',
      'Moradia',
      'Saúde',
      'Educação',
      'Lazer',
      'Trabalho',
      'Outros',
    ]);
  });
});

describe('CATEGORY_COLORS', () => {
  it('dá uma cor para cada categoria', () => {
    for (const categoria of CATEGORIES) {
      expect(CATEGORY_COLORS[categoria]).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it('não repete nenhuma cor', () => {
    // O bug era 6 cores para 8 categorias: duas dividiam a mesma cor e não
    // dava para distinguir as fatias.
    const cores = CATEGORIES.map((categoria) => CATEGORY_COLORS[categoria]);
    expect(new Set(cores).size).toBe(CATEGORIES.length);
  });
});

describe('categoryColor', () => {
  it('devolve a cor da categoria', () => {
    expect(categoryColor('Alimentação')).toBe(CATEGORY_COLORS['Alimentação']);
  });

  it('não depende da ordem: a mesma categoria sempre tem a mesma cor', () => {
    // Antes a cor vinha do índice da fatia (`COLORS[index % 6]`), então a
    // categoria trocava de cor quando o total reordenava o gráfico.
    const primeira = categoryColor('Lazer');
    const segunda = categoryColor('Lazer');
    expect(primeira).toBe(segunda);
    expect(primeira).not.toBe(categoryColor('Transporte'));
  });

  it('cai no cinza para categoria desconhecida', () => {
    expect(categoryColor('Categoria que a API não conhece')).toBe(CATEGORY_COLORS.Outros);
    expect(categoryColor('')).toBe(CATEGORY_COLORS.Outros);
  });
});


describe('comCoresPorCategoria', () => {
  it('dá uma cor distinta para cada uma das 8 categorias', () => {
    const totais = CATEGORIES.map((category, i) => ({ category, total: (i + 1) * 10 }));

    const comCor = comCoresPorCategoria(totais);

    expect(comCor).toHaveLength(8);
    expect(new Set(comCor.map((linha) => linha.fill)).size).toBe(8);
  });

  it('mantém a cor da categoria mesmo quando a ordem muda', () => {
    // O bug: a cor vinha do índice da fatia, então reordenar o gráfico por
    // valor trocava a cor das categorias.
    const totais = [
      { category: 'Transporte', total: 100 },
      { category: 'Lazer', total: 50 },
    ];

    const direto = comCoresPorCategoria(totais);
    const invertido = comCoresPorCategoria([...totais].reverse());

    const corDe = (linhas: Array<{ category: string; fill: string }>, categoria: string) =>
      linhas.find((linha) => linha.category === categoria)?.fill;

    expect(corDe(invertido, 'Transporte')).toBe(corDe(direto, 'Transporte'));
    expect(corDe(invertido, 'Lazer')).toBe(corDe(direto, 'Lazer'));
    // E a cor independe do valor: só a categoria importa.
    expect(corDe(comCoresPorCategoria([{ category: 'Lazer', total: 999 }]), 'Lazer')).toBe(
      corDe(direto, 'Lazer'),
    );
  });

  it('preserva os dados originais', () => {
    const [linha] = comCoresPorCategoria([{ category: 'Saúde', total: 42 }]);
    expect(linha).toMatchObject({ category: 'Saúde', total: 42 });
  });

  it('usa o cinza para categoria que a API não conhece', () => {
    const [linha] = comCoresPorCategoria([{ category: 'Nova', total: 1 }]);
    expect(linha.fill).toBe(CATEGORY_COLORS.Outros);
  });
});
