import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  erro: Error | null;
}

/**
 * Última linha de defesa da interface.
 *
 * Sem um boundary, um erro de render em qualquer componente derruba a árvore
 * inteira e o usuário vê tela branca: sem mensagem, sem saída, sem saber se
 * perdeu dados. Com ele, o erro fica contido e a pessoa tem o que fazer.
 *
 * Precisa ser classe: `componentDidCatch`/`getDerivedStateFromError` não têm
 * equivalente em hook.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  componentDidCatch(erro: Error, info: ErrorInfo): void {
    // Não há coletor de erros no frontend; o console é o registro disponível.
    // O `console.error` também mantém o comportamento esperado em
    // desenvolvimento, onde o React já imprime o erro no console.
    console.error('Erro não tratado na interface:', erro, info.componentStack);
  }

  private tentarDeNovo = (): void => {
    this.setState({ erro: null });
  };

  private recarregar = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { erro } = this.state;
    if (!erro) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div
          role="alert"
          className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full space-y-5 text-center"
        >
          <div className="flex justify-center">
            <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">Algo deu errado</h1>
            <p className="text-slate-400 text-sm">
              A tela encontrou um erro inesperado. Seus dados continuam salvos — nada do que
              você registrou foi perdido.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
            <button
              onClick={this.tentarDeNovo}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Tentar novamente
            </button>
            <button
              onClick={this.recarregar}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar página
            </button>
          </div>

          {/* Detalhe técnico só em desenvolvimento: em produção não ajuda o
              usuário e pode expor informação interna. */}
          {import.meta.env.DEV && (
            <pre className="text-left text-xs text-red-300 bg-slate-900/70 border border-slate-700 rounded-lg p-3 overflow-auto max-h-40">
              {erro.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
