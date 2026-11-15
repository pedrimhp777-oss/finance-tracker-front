# Finance Tracker — Frontend

Frontend do **Finance Tracker**, aplicação full-stack de controle financeiro
pessoal. Consome a API
[`finance-tracker`](https://github.com/pedrimhp777-oss/finance-tracker).

🔗 **Aplicação no ar:** https://finance-tracker-front-pearl.vercel.app

## Funcionalidades

- 🔐 Login e cadastro com feedback visual (toasts) e estados de carregamento
- 📊 Dashboard com resumo financeiro (entradas, saídas, saldo) calculado
  pelo servidor
- 📈 Gráficos de despesas por categoria e entradas vs saídas (carregamento
  sob demanda via code-splitting)
- 🔍 Filtros por busca, categoria, mês e ano — aplicados **no servidor**,
  com o fuso horário do usuário
- 📄 Paginação incremental ("carregar mais")
- 📥 Exportação Excel refletindo exatamente os filtros aplicados
- ♿ Acessibilidade: labels associados, `aria-*` nos botões e modal de confirmação

## Tecnologias

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Axios (interceptors de autenticação e sessão expirada)
- Recharts, Lucide React, React Hot Toast
- Vitest + Testing Library

## Estrutura

```
src/
├── pages/
│   ├── Auth.tsx              # Login/cadastro
│   └── Dashboard.tsx         # Painel principal (topbar, resumo, tabela)
├── components/
│   ├── FinanceCharts.tsx     # Gráficos (lazy-loaded)
│   ├── FinanceFilters.tsx    # Barra de filtros
│   └── TransactionForm.tsx   # Formulário de transação (criar/editar)
├── hooks/
│   └── useTransactions.ts    # Acesso à API: listagem, resumo, CRUD, export
├── contexts/
│   └── AuthContext.tsx       # Sessão do usuário
├── services/
│   └── api.ts                # Cliente Axios configurado
├── types/
│   └── finance.ts            # Contratos da API
└── tests/                    # Testes Vitest + Testing Library
```

## Requisitos

- Node.js 20+

## Instalação e execução local

```bash
npm ci
cp .env.example .env      # aponta VITE_API_URL para a API local
npm run dev
```

Abre em `http://localhost:5173`.

### Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL da API (padrão local: `http://localhost:8000`) |

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Verificação de tipos + build de produção |
| `npm run lint` | Lint (oxlint) |
| `npm run test` | Testes (Vitest) |
| `npm run preview` | Serve o build de produção localmente |

## Deploy

- Hospedado na [Vercel](https://vercel.com), com deploy automático a cada
  push na branch principal.
- O backend correspondente roda no Render com PostgreSQL no Neon.

CI: GitHub Actions executa lint, build e testes a cada push/PR.
