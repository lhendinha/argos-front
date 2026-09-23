import type {
  BuscaLida,
  BuscaPedida,
  GravacaoLida,
  GravacaoPedida,
  PreviaDaImportacao,
  ResultadoDaImportacao,
} from "../../types";
import { chamar } from "./client";

/** `POST /subgrupos/{id}/processos/buscar-por-oab` -- procura e NÃO grava.
 *
 * 🔴 É `POST` apesar de não criar processo nenhum: ela guarda o resultado no
 * servidor (para a confirmação não precisar buscar de novo) e recebe quatro
 * campos no corpo. Um `GET` com efeito colateral e parâmetros de consulta
 * seria pior nos dois pontos.
 *
 * ⚠️ Piso `manager` -- a mesma régua da confirmação. Um `user` não chega aqui.
 *
 * 🔴 **Duas respostas possíveis, de propósito.** A API antiga devolve a prévia
 * inteira; a da Fase 3b do balde devolve 202 com o id, e a lista vem pelo
 * canal. O front sobe PRIMEIRO e aceita as duas -- na ordem inversa, a tela
 * leria `processos` de uma resposta que não os tem.
 */
export function buscarProcessosPorOab(
  subgrupoId: string,
  numeroOab: string,
  ufOab: string,
  periodo: { de?: string; ate?: string } = {},
): Promise<PreviaDaImportacao | BuscaPedida> {
  return chamar(`/subgrupos/${subgrupoId}/processos/buscar-por-oab`, {
    method: "POST",
    body: {
      numero_oab: numeroOab,
      uf_oab: ufOab,
      de: periodo.de ?? "",
      ate: periodo.ate ?? "",
    },
  }) as Promise<PreviaDaImportacao | BuscaPedida>;
}

/** `GET /subgrupos/{id}/processos/buscas/{trabalho_id}` -- o estado da busca, e a
 * prévia inteira quando ela terminou. `404` para busca de outra pessoa. */
export function lerBusca(subgrupoId: string, trabalhoId: string): Promise<BuscaLida> {
  return chamar(`/subgrupos/${subgrupoId}/processos/buscas/${trabalhoId}`) as Promise<BuscaLida>;
}

/** `POST /subgrupos/{id}/processos/importar` -- grava os escolhidos.
 *
 * ⚠️ Manda o `id` da busca, não os dados: o histórico já está no servidor. É
 * o que evita subir 19,6 MB pelo navegador e evita consultar o PJe de novo.
 *
 * ⚠️ `responsaveis` vazio vira quem está importando, resolvido no SERVIDOR --
 * é o que faz a API poder subir antes do front.
 */
export function importarProcessos(
  subgrupoId: string,
  idDaBusca: string,
  numeros: string[],
  responsaveis: string[] = [],
): Promise<ResultadoDaImportacao | GravacaoPedida> {
  return chamar(`/subgrupos/${subgrupoId}/processos/importar`, {
    method: "POST",
    body: { id: idDaBusca, numeros, responsaveis },
  }) as Promise<ResultadoDaImportacao | GravacaoPedida>;
}

/** `GET /subgrupos/{id}/processos/importacoes/{trabalho_id}` -- o estado da gravação,
 * e os três números quando ela terminou. ⚠️ A API antiga respondia os números no
 * `POST` (201); a da Fase 4 do balde responde 202, e o front aceita as duas. */
export function lerGravacao(subgrupoId: string, trabalhoId: string): Promise<GravacaoLida> {
  return chamar(`/subgrupos/${subgrupoId}/processos/importacoes/${trabalhoId}`) as Promise<GravacaoLida>;
}
