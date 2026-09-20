import type { Lancamento } from "../../../../types";

export interface ItemDaEmissaoProps {
  lancamento: Lancamento;
  /** Entra na fatura. Vem de fora porque a lista guarda os DESMARCADOS -- o
   * padrão é incluir tudo. */
  incluido: boolean;
  /** Uma marcação de "não cobrar" está em voo: trava o botão de todos, como
   * na tabela. */
  naoCobrarEmVoo: boolean;
  onAlternar: () => void;
  onNaoCobrar: (lancamento: Lancamento) => void;
}
