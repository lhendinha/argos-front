import { LEITURA_LIDOS, LEITURA_NAO_LIDOS, TIPO_ENVIO_LEMBRETE, TIPO_ENVIO_MOVIMENTACAO } from "../../constants";

/** Os filtros de tipo do histórico.
 *
 * "Todos" primeiro: é o mais abrangente, e um menu que começa pelo geral e
 * desce pro específico se lê sem pensar.
 *
 * ⚠️ `id` e `valor` são coisas diferentes de propósito. `valor` é o que vai
 * pra API, e o de "Todos" é vazio (sem filtro) -- mas item de menu com
 * `value=""` não é registrado pelo zag, então ele simplesmente não
 * selecionava. O `id` existe pra dar a cada opção uma identidade não vazia.
 */
export const TIPOS_DE_ENVIO = [
  { id: "todos", valor: "", rotulo: "Todos" },
  { id: TIPO_ENVIO_MOVIMENTACAO, valor: TIPO_ENVIO_MOVIMENTACAO, rotulo: "Movimentações" },
  { id: TIPO_ENVIO_LEMBRETE, valor: TIPO_ENVIO_LEMBRETE, rotulo: "Lembretes" },
] as const;

/** A tela abre filtrada em Movimentações: é o que se olha no dia a dia.
 * Lembrete é diário e dominaria a lista.
 *
 * ⚠️ Filtro que nasce ligado precisa PARECER ligado -- senão a pessoa vê
 * uma lista incompleta achando que está vendo tudo. Daí a pílula já nascer
 * no estado ativo, e a opção escolhida ficar realçada no menu. */
export const TIPO_DE_ENVIO_PADRAO = TIPO_ENVIO_MOVIMENTACAO;


/** As duas pílulas que a Área de trabalho aciona.
 *
 * 🔴 Existem porque os cards abriam a lista errada: "Envios com falha: 2"
 * abria o histórico inteiro e "Movimentações (7 dias): 3" abria todas as
 * movimentações de sempre. Medido em 26/08/2026: 2 contra 6, e 3 contra 4.
 *
 * ⚠️ Mesmo padrão de `TIPOS_DE_ENVIO` acima: `id` não vazio (o zag não
 * registra item de menu com `value=""`) e `valor` sendo o que vai pra API.
 */
export const FILTROS_DE_FALHA = [
  { id: "todos", valor: false, rotulo: "Todos os envios" },
  { id: "falha", valor: true, rotulo: "Só com falha" },
] as const;

/** A janela de "Movimentações (N dias)" do card da Área de trabalho.
 *
 * ⚠️ UM lugar, usado pelo rótulo E pelo `dias` que vai pra API. Dois
 * literais divergiriam no primeiro ajuste, e aí o card voltaria a anunciar
 * uma janela diferente da que a lista aplica.
 *
 * (No servidor o mesmo número é `resumo_service.DIAS_DA_JANELA_DE_MOVIMENTACOES`.
 * Não dá pra unificar através da fronteira sem a API devolver a janela na
 * resposta -- e o nome do campo `movimentacoes_7_dias` já congela o 7 no
 * contrato de qualquer forma.)
 */
export const DIAS_DA_JANELA_RECENTE = 7;

/** O filtro de leitura: o lido é de cada pessoa.
 *
 * ⚠️ Mesmo padrão dos de cima: `id` não vazio e `valor` indo pra API. O `id` das duas opções É o valor, e é por ele que
 * o menu acha a contagem de cada uma na resposta (`contagens_da_leitura`).
 */
export const FILTROS_DE_LEITURA = [
  { id: "todos", valor: "", rotulo: "Lidos e não lidos" },
  { id: LEITURA_NAO_LIDOS, valor: LEITURA_NAO_LIDOS, rotulo: "Só não lidos" },
  { id: LEITURA_LIDOS, valor: LEITURA_LIDOS, rotulo: "Só lidos" },
] as const;

export const FILTROS_DE_PERIODO = [
  { id: "todos", valor: 0, rotulo: "Todos os períodos" },
  { id: "recente", valor: DIAS_DA_JANELA_RECENTE, rotulo: `Últimos ${DIAS_DA_JANELA_RECENTE} dias` },
] as const;

/** As cinco colunas da tabela do histórico.
 *
 * 🔴 **Elas já existiam -- grudadas por pontos numa linha só.** A meta do
 * item era `data e hora · tipo · órgão` num texto só: três campos colados,
 * que a tabela apenas descola. E "quais falharam no envio" deixa de ser uma
 * caçada linha a linha para ser uma coluna.
 *
 * ⚠️ **"Envio e subgrupos", e não "Situação".** A coluna carrega as duas
 * coisas, como em `COLUNAS_DE_ATENDIMENTOS` -- mas aqui a lista de subgrupos
 * pode vir VAZIA, e `EtiquetasDeSubgrupo` desenha um travessão nesse caso.
 * Sob um cabeçalho que dizia só "Situação", o traço ao lado de "ENVIADO" não
 * tinha a que se referir.
 */
export const COLUNAS_DO_HISTORICO = [
  "Processo",
  "Tipo",
  "Órgão ou destinatário",
  "Envio e subgrupos",
  { rotulo: "Enviado em", aDireita: true },
] as const;
