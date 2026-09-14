import { chamar } from "./client";
import type { AlvoDaLeitura, OpcoesListarHistorico } from "../../types";

/** GET /historico -- depende de contexto de grupo (resolvido no backend
 * pelo próprio token) e pagina de verdade, igual /processos. */
export function listarHistorico(opcoes: OpcoesListarHistorico = {}) {
  const { numeroProcesso, subgrupoId, tipoEnvio, apenasComFalha, dias, leitura, pagina, tamanhoPagina } =
    opcoes;
  /* 🔴 O `numeroProcesso` vai JUNTO com os outros: aqui ele é um filtro como
   * os demais, e quem escolheu "Cível" e "últimos 7 dias" e digita um número
   * continua com os três valendo. O ramo do servidor que lê o número sozinho,
   * sem paginação, é a rota separada `historicoDoProcesso`. */
  return chamar("/historico", {
    query: {
      pagina: pagina ? String(pagina) : undefined,
      tamanho_pagina: tamanhoPagina ? String(tamanhoPagina) : undefined,
      numero_processo: numeroProcesso || undefined,
      subgrupo_id: subgrupoId || undefined,
      tipo_envio: tipoEnvio || undefined,
      // Mesmo formato de `sem_responsavel` em /tarefas: string "true", e
      // `undefined` some da query string.
      apenas_com_falha: apenasComFalha ? "true" : undefined,
      dias: dias ? String(dias) : undefined,
      leitura: leitura || undefined,
    },
  });
}

/** `GET /historico/{numero}` -- todo o histórico de UM processo, sem paginar.
 *
 * 🔴 Existe para o link que chega por e-mail. Ele traz `?processo=` e
 * `?comunicacao=`, e o front precisa achar a notificação daquele
 * `comunicacao_id` no conjunto INTEIRO -- procurar numa página devolveria
 * "não encontrei" para algo que está na página seguinte.
 *
 * ⚠️ Por isso NÃO é `listarHistorico({ numeroProcesso })`: aquela pagina. As
 * duas existem de propósito, e são recursos diferentes no servidor. */
export function historicoDoProcesso(numeroProcesso: string) {
  return chamar(`/historico/${encodeURIComponent(numeroProcesso)}`);
}

/** `GET /historico/nao-lidos` -- o contador do menu, sem filtro nenhum. */
export function contarNaoLidosDoHistorico() {
  return chamar("/historico/nao-lidos");
}

/** `POST /historico/leituras` -- marca como lido o envio que a pessoa abriu.
 *
 * ⚠️ Repetir não soma de novo: a resposta diz quantos ESTA chamada marcou. Pela sequência, o envio que a pessoa não vê
 * dá 404; pela movimentação do detalhe do processo, não achar é zero. */
export function marcarEnvioComoLido(alvo: AlvoDaLeitura) {
  return chamar("/historico/leituras", { method: "POST", body: { ...alvo } });
}

/** `POST /historico/marcar-todos-lidos` -- tudo o que a pessoa vê fica lido, ignorando os filtros. */
export function marcarTodosComoLidos() {
  return chamar("/historico/marcar-todos-lidos", { method: "POST" });
}

/** `POST /historico/desfazer-marcar-todos` -- volta atrás, dentro de um minuto, com a geração que o "marcar todos"
 * devolveu. */
export function desfazerMarcarTodos(geracao: number) {
  return chamar("/historico/desfazer-marcar-todos", { method: "POST", body: { geracao } });
}
