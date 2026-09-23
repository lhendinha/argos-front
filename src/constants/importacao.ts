/** A busca por OAB em segundo plano: as palavras que o SERVIDOR manda.
 *
 * 🔴 A busca deixou de voltar na resposta do `POST`: ele responde 202 com o
 * id, e a lista chega pelo canal, página a página, e no fim. Os tipos e os
 * estados abaixo são contrato com `busca_em_segundo_plano` da API.
 */

/** As linhas ATUALIZADAS dos processos que a página tocou -- a tela SUBSTITUI
 * a linha pelo número, nunca acrescenta. */
export const TIPO_DA_PAGINA_DA_BUSCA = "importacao_busca";
/** O fim: o `id` do bloco para a confirmação, ou o `erro` do PJe. */
export const TIPO_DO_FIM_DA_BUSCA = "importacao_busca_fim";

/** Os estados de um trabalho em segundo plano -- a busca e a gravação usam os mesmos. */
export const TRABALHO_NA_FILA = "na_fila";
export const TRABALHO_CONCLUIDO = "concluido";
export const TRABALHO_FALHOU = "falhou";

/** O fim da GRAVAÇÃO: os três números, ou o `erro` de quem caiu no meio. O
 * progresso continua no `importacao_progresso` de sempre. */
export const TIPO_DO_FIM_DA_GRAVACAO = "importacao_fim";

/** ⚠️ Enquanto busca, a tela relê pelo `GET` neste intervalo: o canal pode ter
 * caído (aba sem conexão, rede do escritório), e o fim chegaria só por ele. */
export const INTERVALO_DE_RELEITURA_DA_BUSCA_MS = 5000;

/** Onde a tela guarda o id da busca em andamento, por subgrupo -- é o que a faz
 * voltar ao resultado depois de recarregar. */
export const PREFIXO_DA_BUSCA_GUARDADA = "argos:busca-por-oab:";

/** ⚠️ Nunca "a importação falhou": um corte no meio deixa processos gravados, e a
 * frase mandaria a pessoa procurar o que já está lá. Repetir é seguro -- o servidor
 * pula o que já existe. */
export const MENSAGEM_DE_INTERRUPCAO_DA_IMPORTACAO =
  "A importação foi interrompida; parte dos processos pode ter sido cadastrada. " +
  "Buscar de novo cadastra só o que falta.";
