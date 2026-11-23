import { useEffect, useRef, type RefObject } from 'react';

const FOCAVEIS = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Acessibilidade de diálogo modal: Esc fecha, Tab circula por dentro e o foco
 * volta para o elemento que abriu o diálogo ao fechar.
 *
 * Sem isso, o teclado escapava para a página atrás do modal (que continua no
 * DOM) e o usuário podia ativar um botão invisível — inclusive o de excluir.
 *
 * @param aberto se o diálogo está montado
 * @param aoFechar chamada no Esc; precisa ser estável (`useCallback`)
 */
export const useDialogA11y = (
  aberto: boolean,
  aoFechar: () => void,
): RefObject<HTMLDivElement | null> => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const container = containerRef.current;
    if (!container) return;

    const anterior = document.activeElement as HTMLElement | null;
    // Sem filtro de visibilidade: `offsetParent` é null no jsdom e também para
    // qualquer elemento dentro de um contêiner `position: fixed` — filtrar por
    // ele esvaziaria a lista justamente nos diálogos que este hook atende.
    const focaveis = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCAVEIS));

    // Primeiro focável: o botão seguro (cancelar), não o destrutivo.
    const primeiro = focaveis()[0];
    if (primeiro) primeiro.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        aoFechar();
        return;
      }
      if (event.key !== 'Tab') return;

      const itens = focaveis();
      if (itens.length === 0) return;
      const primeiroItem = itens[0];
      const ultimoItem = itens[itens.length - 1];

      if (event.shiftKey && document.activeElement === primeiroItem) {
        event.preventDefault();
        ultimoItem.focus();
      } else if (!event.shiftKey && document.activeElement === ultimoItem) {
        event.preventDefault();
        primeiroItem.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      anterior?.focus();
    };
  }, [aberto, aoFechar]);

  return containerRef;
};
