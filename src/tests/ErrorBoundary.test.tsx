import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { ErrorBoundary } from '../components/ErrorBoundary';

/** Componente que quebra no primeiro render e funciona depois. */
let deveFalhar = true;

const Instavel = () => {
  if (deveFalhar) throw new Error('falha proposital no render');
  return <p>conteúdo recuperado</p>;
};

describe('ErrorBoundary', () => {
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    deveFalhar = true;
    // O React imprime o erro capturado; silenciamos para não poluir a saída.
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    vi.unstubAllEnvs();
  });

  it('mostra a mensagem em vez de tela branca', () => {
    render(
      <ErrorBoundary>
        <Instavel />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument();
    // O usuário precisa saber que o dado não se perdeu.
    expect(screen.getByText(/nada do que você registrou foi perdido/i)).toBeInTheDocument();
  });

  it('registra o erro no console para diagnóstico', () => {
    render(
      <ErrorBoundary>
        <Instavel />
      </ErrorBoundary>,
    );

    expect(consoleError).toHaveBeenCalled();
    const chamada = consoleError.mock.calls.find((args) =>
      String(args[0]).includes('Erro não tratado na interface'),
    );
    expect(chamada).toBeTruthy();
  });

  it('"Tentar novamente" volta a renderizar o conteúdo quando o erro passa', async () => {
    const user = userEvent.setup();
    render(
      <ErrorBoundary>
        <Instavel />
      </ErrorBoundary>,
    );

    deveFalhar = false;
    await user.click(screen.getByRole('button', { name: /tentar novamente/i }));

    expect(screen.getByText('conteúdo recuperado')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renderiza os filhos sem alteração quando não há erro', () => {
    deveFalhar = false;

    render(
      <ErrorBoundary>
        <Instavel />
      </ErrorBoundary>,
    );

    expect(screen.getByText('conteúdo recuperado')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('em produção, não expõe a mensagem técnica do erro', () => {
    // `import.meta.env.DEV` é true nos testes; aqui simulamos o build.
    vi.stubEnv('DEV', false);

    render(
      <ErrorBoundary>
        <Instavel />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText(/falha proposital no render/)).not.toBeInTheDocument();
  });

  it('em desenvolvimento, mostra o detalhe para diagnóstico', () => {
    render(
      <ErrorBoundary>
        <Instavel />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/falha proposital no render/)).toBeInTheDocument();
  });
});
