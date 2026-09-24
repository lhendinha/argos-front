/** Como a tela lê um erro da API: passageiro, sessão encerrada, ou definitivo.
 *
 * ➡️ Quem usa: `queryClient` e `useReleituraDoTrabalho`.
 */
import { ApiError } from "./api";
import { estaAutenticado } from "./auth";

/** O 401 que sobrou depois de `chamar` tentar renovar: a sessão acabou de verdade? */
export function ehSessaoExpirada(erro: unknown): boolean {
  if (!(erro instanceof ApiError) || erro.status !== 401) return false;

  /* 🔴 401 sozinho NÃO é sessão expirada.
   *
   * `chamar` tenta renovar antes de desistir; se a renovação não deu certo,
   * ele propaga o 401 ORIGINAL -- e aí este handler deslogava, mesmo quando
   * a falha tinha sido de rede e o refresh token seguia válido no servidor.
   * Tirar o `limparTokens()` de dentro do `chamar` não resolveu nada: o
   * caminho que desloga é este aqui.
   *
   * `renovarToken` já faz a distinção certa e é a fonte a consultar: ele
   * limpa os tokens QUANDO o servidor recusa o refresh, e não limpa quando
   * a rede caiu. Então "ainda tenho tokens" significa "a renovação falhou
   * por motivo transitório" -- e a sessão continua de pé. */
  return !estaAutenticado();
}

/** Achado 15: erro 4xx (400/403/404/409...) é determinístico -- tentar de
 * novo nunca vai resolver sozinho, só atrasa em ~7s (backoff padrão de 3
 * tentativas) mostrar o erro certo pro usuário. Erro de rede (não é
 * `ApiError`, ex. `fetch` falhando) ou 5xx podem ser transitórios, esses
 * continuam tentando de novo. */
export function podeSerTransitorio(erro: unknown): boolean {
  if (!(erro instanceof ApiError)) return true;
  return erro.status >= 500;
}

/** A espera de um trabalho em segundo plano tenta de novo depois deste erro?
 *
 * ⚠️ Mais tolerante que `podeSerTransitorio`, de propósito: o 401 com a sessão viva
 * (a renovação caiu por rede) e o 429 (o limite do estágio) também passam. O
 * trabalho segue no servidor, e desistir por eles mostrava erro de um trabalho que
 * terminava bem. O que sobra -- 404, 403 -- é definitivo.
 */
export function podeTentarDeNovo(erro: unknown): boolean {
  if (podeSerTransitorio(erro)) return true;
  if (!(erro instanceof ApiError)) return false;
  return erro.status === 429 || (erro.status === 401 && !ehSessaoExpirada(erro));
}
