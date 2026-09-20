import type { ReactNode } from "react";

import type { ValorDoItem } from "../../../../components/ItemDeLista/types";

export interface ItemDoCatalogoProps {
  nome: string;
  ativo: boolean;
  onAbrir?: () => void;
  onAlternarAtivo?: () => void;
  /** A linha está no meio de uma gravação -- o botão de arquivar espera. */
  ocupada?: boolean;
  /** A segunda linha: o detalhe que a tabela põe na coluna do meio. */
  apoio?: string;
  etiquetas?: ReactNode;
  valor?: ValorDoItem;
}
