import type { ProcessoEncontrado } from "../../../../types";

/** Uma linha da prévia: o processo, se está marcado, e o que o clique faz. */
export interface ItemDaPreviaProps {
  processo: ProcessoEncontrado;
  marcado: boolean;
  onAlternar: () => void;
}
