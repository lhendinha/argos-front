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

export const BUSCA_NA_FILA = "na_fila";
export const BUSCA_CONCLUIDA = "concluido";
export const BUSCA_FALHOU = "falhou";

/** ⚠️ Enquanto busca, a tela relê pelo `GET` neste intervalo: o canal pode ter
 * caído (aba sem conexão, rede do escritório), e o fim chegaria só por ele. */
export const INTERVALO_DE_RELEITURA_DA_BUSCA_MS = 5000;

/** Onde a tela guarda o id da busca em andamento, por subgrupo -- é o que a faz
 * voltar ao resultado depois de recarregar. */
export const PREFIXO_DA_BUSCA_GUARDADA = "argos:busca-por-oab:";
