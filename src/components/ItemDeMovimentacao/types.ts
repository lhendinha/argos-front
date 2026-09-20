export interface ItemDeMovimentacaoProps {
  titulo: string;
  /** O aviso desta movimentação, e em que pé ele está.
   *
   * 🔴 **São TRÊS estados, e por isso não é booleano.** `naoLido` e `lido`
   * dizem que houve e-mail; `undefined` diz que NÃO HOUVE -- e essa é a
   * maioria, 9 de 73 medido em produção. Um booleano juntaria "lida" com
   * "nunca avisou", que são coisas diferentes, e é exatamente a confusão que
   * `Comunicacao.lido`, sendo esparso, convida a fazer.
   *
   * ⚠️ Resolvido por quem chama, a partir de `Comunicacao.lido`. */
  aviso?: "naoLido" | "lido";
  /** A data e o órgão, na linha de baixo. */
  meta: string;
  /** Abre o detalhe -- a linha inteira é o alvo.
   *
   * ⚠️ Obrigatório desde que o item virou `ItemDeLista`: o contrato é de
   * lista NAVEGÁVEL, e o único chamador sempre abriu o detalhe. Uma linha de
   * leitura pura é outro componente, não esta com a prop apagada. */
  onAbrir: () => void;
}
