import { chamar } from "./client";
import type { DadosDaFatura, DadosDoPagamento } from "../../types/requisicoes";
import type { FiltrosDeFaturas, OpcoesDoFluxo } from "../../types";
import type { OpcoesDePaginacao } from "../../types/api";

/** As faturas do escritório e o fluxo de caixa.
 *
 * ⚠️ Aqui só entram CHAMADAS. O que monta o CSV mora em `utils/planilha`, e
 * o que soma as colunas da tela, em `utils/fluxoDeCaixa`.
 *
 * ➡️ `pages/FinanceiroPage`, abas Faturas e Fluxo de caixa.
 */

/** Uma página dos clientes com honorário ou despesa esperando cobrança, em
 * ordem de nome.
 *
 * 🔴 Paginada, e só com o RESUMO de cada cliente (total, quantidade, o
 * vencimento mais antigo). Chegou a não paginar -- "são poucos clientes" --,
 * mas num escritório grande são milhares, e a resposta com os lançamentos
 * dentro passava dos 6 MB da API. Os lançamentos vêm de
 * `listarAFaturarDoCliente`, ao abrir a emissão.
 *
 * ⚠️ Sem `pagina` a API devolve o formato antigo, com os lançamentos: a tela
 * sempre manda a página. */
export function listarAFaturar({ pagina = 1, tamanhoPagina }: OpcoesDePaginacao = {}) {
  return chamar("/faturas/a-faturar", {
    query: {
      pagina: String(pagina),
      tamanho_pagina: tamanhoPagina ? String(tamanhoPagina) : undefined,
    },
  });
}

/** Os lançamentos de UM cliente que ainda não foram cobrados -- o que o modal
 * de emissão mostra para desmarcar. */
export function listarAFaturarDoCliente(clienteId: string) {
  return chamar(`/faturas/a-faturar/${clienteId}`);
}

/** As faturas já emitidas, do período.
 *
 * ⚠️ Sem `de`/`ate` traz todas -- é o "Todos os períodos" da pílula. */
/** A página de "Emitidas", filtrada pelo VENCIMENTO.
 *
 * 🔴 Paginada no servidor, pelo índice estreito: nenhuma fatura é apagada
 * -- paga e cancelada ficam --, então a lista só cresce. */
export function listarFaturas({ pagina, tamanhoPagina, ...filtros }: FiltrosDeFaturas = {}) {
  return chamar("/faturas", {
    query: {
      ...filtros,
      pagina: pagina ? String(pagina) : undefined,
      tamanho_pagina: tamanhoPagina ? String(tamanhoPagina) : undefined,
    },
  });
}

export function detalheFatura(faturaId: string) {
  return chamar(`/faturas/${faturaId}`);
}

/** Emite a fatura com os lançamentos escolhidos.
 *
 * 🔴 A despesa NÃO vira linha de cobrança: a emissão cria um RECEBÍVEL de
 * reembolso no valor dela e carimba a despesa como cobrada. Somá-la como
 * linha faria o total do documento não bater com o que o cliente deve. */
export function emitirFatura(dados: DadosDaFatura) {
  return chamar("/faturas", { method: "POST", body: dados });
}

/** Paga o documento INTEIRO -- não existe valor parcial, e mandar um é 422.
 *
 * ⚠️ Quem recebeu parte efetiva o lançamento sozinho, pela lista. */
export function pagarFatura(faturaId: string, dados: DadosDoPagamento = {}) {
  return chamar(`/faturas/${faturaId}/pagar`, { method: "POST", body: dados });
}

/** Cancela a fatura e devolve os lançamentos dela para "a faturar". */
export function cancelarFatura(faturaId: string) {
  return chamar(`/faturas/${faturaId}/cancelar`, { method: "POST" });
}

/** O fluxo de caixa, mês a mês.
 *
 * ⚠️ Sem `de`/`ate` a API devolve o ANO corrente, que é o padrão da tela.
 * As pontas são MESES (`aaaa-mm`), não datas -- a tabela é mensal. */
export function lerFluxoDeCaixa(opcoes: OpcoesDoFluxo = {}) {
  return chamar("/financeiro/fluxo-de-caixa", { query: { ...opcoes } });
}
