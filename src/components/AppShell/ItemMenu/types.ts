import type { ItemNavegacao } from "../../../types";

export interface ItemMenuProps {
  item: ItemNavegacao;
  /** Quantos não lidos o item tem -- só o Histórico. Zero ou ausente, a pílula não aparece. */
  contador?: number;
}
