# Finance Tracker frontend

Front-end React + Vite para o Finance Tracker.

Defina `VITE_API_URL` antes do build. Localmente, copie `.env.example` para `.env`. No Vercel, configure a vari�vel `VITE_API_URL` com a URL p�blica da API no Render e fa�a um novo deploy. Essa vari�vel � p�blica por defini��o; nunca coloque segredos nela.

O painel busca as transa��es em p�ginas de at� 500 itens e calcula os totais com os mesmos filtros aplicados � lista e aos gr�ficos. A exporta��o para Excel envia esses filtros ao back-end.
