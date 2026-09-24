import { CHAVE_DA_IMPORTACAO_GUARDADA } from "../constants";
import type { ImportacaoGuardada } from "../types";

/** A importação por OAB desta aba, guardada na sessão: a busca, e a gravação quando começou.
 *
 * ⚠️ Conveniência, e só: o `sessionStorage` pode vir vazio ou lançar (aba privada,
 * dado bloqueado), e a tela funciona sem ele -- o trabalho segue no servidor, e o
 * pior caso é buscar de novo. Por isso todo acesso é protegido, e o que não tem a
 * forma certa (um valor de outra versão da tela) é ignorado.
 */
export function lerImportacaoGuardada(email: string): ImportacaoGuardada | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE_DA_IMPORTACAO_GUARDADA);
    const lida = bruto ? (JSON.parse(bruto) as Partial<ImportacaoGuardada>) : null;
    if (!lida || typeof lida.busca !== "string" || typeof lida.subgrupoId !== "string") return null;
    /* 🔴 De outra pessoa (saiu e entrou outra conta na mesma aba): não é desta. */
    if (!email || lida.email !== email) return null;
    return { email, subgrupoId: lida.subgrupoId, busca: lida.busca, gravacao: lida.gravacao };
  } catch {
    return null;
  }
}

export function guardarImportacao(importacao: ImportacaoGuardada): void {
  try {
    sessionStorage.setItem(CHAVE_DA_IMPORTACAO_GUARDADA, JSON.stringify(importacao));
  } catch {
    /* sem armazenamento, a tela só não volta sozinha depois de recarregar */
  }
}

export function esquecerImportacao(): void {
  try {
    sessionStorage.removeItem(CHAVE_DA_IMPORTACAO_GUARDADA);
  } catch {
    /* idem */
  }
}
