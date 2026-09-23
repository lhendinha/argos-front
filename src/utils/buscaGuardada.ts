import { PREFIXO_DA_BUSCA_GUARDADA } from "../constants";

/** O id da busca por OAB em andamento, guardado na sessão por subgrupo.
 *
 * ⚠️ Conveniência, e só: o `sessionStorage` pode vir vazio ou lançar (aba
 * privada, dado bloqueado), e a tela funciona sem ele -- a busca continua no
 * servidor, e o pior caso é buscar de novo. Por isso todo acesso é protegido.
 */
export function lerBuscaGuardada(subgrupoId: string): string | null {
  try {
    return sessionStorage.getItem(PREFIXO_DA_BUSCA_GUARDADA + subgrupoId);
  } catch {
    return null;
  }
}

export function guardarBusca(subgrupoId: string, trabalhoId: string): void {
  try {
    sessionStorage.setItem(PREFIXO_DA_BUSCA_GUARDADA + subgrupoId, trabalhoId);
  } catch {
    /* sem armazenamento, a tela só não volta sozinha depois de recarregar */
  }
}

export function esquecerBusca(subgrupoId: string): void {
  try {
    sessionStorage.removeItem(PREFIXO_DA_BUSCA_GUARDADA + subgrupoId);
  } catch {
    /* idem */
  }
}
