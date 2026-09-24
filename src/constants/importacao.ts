/** A importação por OAB em segundo plano -- a busca e a gravação: as palavras que o SERVIDOR manda.
 *
 * 🔴 Nenhuma das duas volta na resposta do `POST`: ele responde 202 com o id, e
 * o resto chega pelo canal. Os tipos e os estados abaixo são contrato com
 * `busca_em_segundo_plano`, `gravacao_em_segundo_plano` e `importacao_service` da API.
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
/** A lista, para o tipo `EstadoDoTrabalho` sair dela e não ser escrito de novo. */
export const ESTADOS_DO_TRABALHO = [TRABALHO_NA_FILA, TRABALHO_CONCLUIDO, TRABALHO_FALHOU] as const;

/** O fim da GRAVAÇÃO: os três números, ou o `erro` de quem caiu no meio. */
export const TIPO_DO_FIM_DA_GRAVACAO = "importacao_fim";
/** O progresso da gravação, com o `trabalho_id` dela. O MESMO nome da API
 * (`importacao_service.TIPO_DE_PROGRESSO`). */
export const TIPO_DE_PROGRESSO = "importacao_progresso";

/** ⚠️ Enquanto a busca ou a gravação rodam, a tela relê pelo `GET` neste intervalo:
 * o canal pode ter caído (aba sem conexão, rede do escritório), e o fim chegaria só por ele. */
export const INTERVALO_DE_RELEITURA_DO_TRABALHO_MS = 5000;

/** Quanto tempo seguido sem conseguir ler o trabalho antes de a tela avisar "sem
 * contato". ⚠️ Contado da PRIMEIRA falha seguida (ou da leitura presa), e não do
 * último sucesso: um notebook que dormiu acusaria falha ao acordar. */
export const LIMIAR_SEM_CONTATO_MS = 30_000;

/** Onde a aba guarda a importação em andamento -- UMA por aba, com o e-mail e o
 * subgrupo dela: é o que faz a tela recarregada voltar à busca, à prévia ou à gravação. */
export const CHAVE_DA_IMPORTACAO_GUARDADA = "argos:importacao-por-oab";

/** O erro com que a API encerra a busca que outra, da mesma pessoa e da mesma OAB,
 * substituiu. ⚠️ O MESMO texto de `busca_em_segundo_plano.MENSAGEM_SUBSTITUIDA`: é
 * por ele que a tela troca "Não deu para concluir" por "Busca substituída". */
export const MENSAGEM_SUBSTITUIDA = "Esta busca foi substituída por uma mais nova da mesma OAB.";

/** ⚠️ Nunca "a importação falhou": um corte no meio deixa processos gravados, e a
 * frase mandaria a pessoa procurar o que já está lá. Repetir é seguro -- o servidor
 * pula o que já existe. */
export const MENSAGEM_DE_INTERRUPCAO_DA_IMPORTACAO =
  "A importação foi interrompida; parte dos processos pode ter sido cadastrada. " +
  "Buscar de novo cadastra só o que falta.";
