export interface ItemDeMovimentacaoProps {
  titulo: string;
  /** Há um aviso desta movimentação que a pessoa ainda não leu.
   *
   * ⚠️ Booleano JÁ RESOLVIDO por quem chama, e não o `lido` cru: aquele é
   * esparso (só existe quando houve aviso), e um `!lido` distraído acenderia
   * a lista inteira. Ver `Comunicacao.lido`. */
  naoLido?: boolean;
  /** A data e o órgão, na linha de baixo. */
  meta: string;
  /** Abre o detalhe -- a linha inteira é o alvo.
   *
   * ⚠️ Obrigatório desde que o item virou `ItemDeLista`: o contrato é de
   * lista NAVEGÁVEL, e o único chamador sempre abriu o detalhe. Uma linha de
   * leitura pura é outro componente, não esta com a prop apagada. */
  onAbrir: () => void;
}
