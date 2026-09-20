/** Cores da etiqueta "Arquivado" do cliente.
 *
 * 🔴 **Cinza de estado neutro**, o mesmo das etiquetas de subgrupo:
 * "Arquivado" não é bom nem ruim -- é um lugar onde o cliente está. Verde ou
 * vermelho o leriam como resultado.
 *
 * 🔴 **Uma casa só, e o motivo é concreto: eram TRÊS cópias.** A linha da
 * listagem, o formulário do detalhe e -- quando a lista ganhou a forma de
 * item -- também ele, cada um com o literal repetido e o comentário copiado
 * junto. É exatamente o que o docstring de `EtiquetasDeSubgrupo` avisa: cor é
 * contrato, e um literal solto no meio da linha é onde a segunda cópia
 * nasce. No tema, como as do lançamento e as do atendimento.
 */
export const CORES_DO_CLIENTE_ARQUIVADO = {
  bg: "border.subtle",
  color: "fg.muted",
  borderColor: "border",
} as const;
