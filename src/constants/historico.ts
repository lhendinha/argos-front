/** Por que um e-mail saiu: novidade do PJe, ou aviso de prazo.
 *
 * ⚠️ Mora em `constants/` e não na pasta do Histórico porque a Área de
 * trabalho também aponta para cá -- o card "Movimentações (7 dias)" abre o
 * histórico já filtrado, e o valor do filtro tem de ser o MESMO. Era literal
 * nos dois lados.
 *
 * ⚠️ Vocabulário do HISTÓRICO, e não o dos tipos de notificação: a palavra
 * "lembrete" aparece nos dois por coincidência de idioma. Casá-los prenderia
 * o sino ao e-mail, que são coisas diferentes -- `TIPO_LEMBRETE`, de
 * `constants/notificacoes.ts`, é a outra.
 *
 * ⚠️ Vazio ("") é "sem filtro", e por isso não entra na dupla: é ausência de
 * valor, não um terceiro tipo.
 */
export const TIPO_ENVIO_MOVIMENTACAO = "movimentacao";
export const TIPO_ENVIO_LEMBRETE = "lembrete";
export const TIPOS_DE_ENVIO_DO_HISTORICO = [
  TIPO_ENVIO_MOVIMENTACAO,
  TIPO_ENVIO_LEMBRETE,
] as const;

/** O que a pessoa quer ver do histórico: o que ainda não leu, ou o que já leu.
 *
 * 🔴 É contrato com a API: o valor do filtro **leitura**, o mesmo na URL e na
 * consulta. A palavra muda nos dois lados ou em nenhum.
 *
 * ⚠️ Vazio ("") é "Lidos e não lidos" -- sem filtro --, e por isso não entra na
 * dupla, como no tipo de envio. O rótulo de cada opção mora na página.
 *
 * ➡️ `constanteNuncaViraStringSolta.test.ts` e `constants/historico.test.ts`
 */
export const LEITURA_NAO_LIDOS = "nao_lidos";
export const LEITURA_LIDOS = "lidos";
export const LEITURAS_DO_HISTORICO = [LEITURA_NAO_LIDOS, LEITURA_LIDOS] as const;
