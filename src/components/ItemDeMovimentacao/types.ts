export interface ItemDeMovimentacaoProps {
  titulo: string;
  /** A data e o órgão, na linha de baixo. */
  meta: string;
  /** Abre o detalhe -- a linha inteira é o alvo.
   *
   * ⚠️ Obrigatório desde que o item virou `ItemDeLista`: o contrato é de
   * lista NAVEGÁVEL, e o único chamador sempre abriu o detalhe. Uma linha de
   * leitura pura é outro componente, não esta com a prop apagada. */
  onAbrir: () => void;
}
