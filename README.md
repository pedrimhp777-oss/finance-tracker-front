# Finance Tracker frontend

Front-end React + Vite para o Finance Tracker.

Defina `VITE_API_URL` antes do build. Localmente, copie `.env.example` para `.env`. No Vercel, configure a variável `VITE_API_URL` com a URL pública da API no Render e faça um novo deploy. Essa variável é pública por definição; nunca coloque segredos nela.

O painel busca as transações em páginas de até 500 itens e calcula os totais com os mesmos filtros aplicados à lista e aos gráficos. A exportação para Excel envia esses filtros ao back-end.

