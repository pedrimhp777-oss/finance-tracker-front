/**
 * Leitura do token de redefinição de senha a partir da URL.
 *
 * O backend manda o token no **fragmento** (`/#reset_token=...`). O navegador
 * nunca envia o fragmento ao servidor: ele fica fora dos logs de acesso, do
 * `Referer` e de qualquer proxy no caminho. Na query, o token aparecia nos
 * logs de toda requisição feita ao abrir o link.
 *
 * A query continua aceita como fallback: um e-mail enviado segundos antes do
 * deploy ainda tem 30 minutos de validade.
 */

export const RESET_TOKEN_PARAM = 'reset_token';

const naoVazio = (valor: string | null | undefined): string | null => {
  const limpo = valor?.trim();
  return limpo ? limpo : null;
};

const semCerquilha = (hash: string): string => hash.replace(/^#/, '');

/** Remove um par `chave=valor` preservando o resto exatamente como veio. */
const removerParametro = (bruto: string, chave: string): string =>
  bruto
    .split('&')
    .filter((par) => par !== '' && par.split('=')[0] !== chave)
    .join('&');

export function readResetToken(location: Location = window.location): string | null {
  const doFragmento = naoVazio(
    new URLSearchParams(semCerquilha(location.hash)).get(RESET_TOKEN_PARAM),
  );
  if (doFragmento) return doFragmento;

  return naoVazio(new URLSearchParams(location.search).get(RESET_TOKEN_PARAM));
}

/** Remove o token da barra de endereço e do histórico do navegador. */
export function clearResetTokenFromUrl(): void {
  if (typeof window === 'undefined') return;

  const { pathname, search, hash } = window.location;

  const query = removerParametro(search.replace(/^\?/, ''), RESET_TOKEN_PARAM);
  const fragmento = removerParametro(semCerquilha(hash), RESET_TOKEN_PARAM);

  window.history.replaceState(
    {},
    '',
    `${pathname}${query ? `?${query}` : ''}${fragmento ? `#${fragmento}` : ''}`,
  );
}
