import type { ReactNode } from "react";

import type { Documento } from "../../../../types";

export interface ListaDeDocumentosProps {
  documentos: Documento[];
  subgrupoNome: (id: string) => string;
  onAbrir: (documento: Documento) => void;
  /** O MESMO estado vazio nos dois caminhos -- ele já distingue "não existe
   * nada" de "a busca não achou nada", e uma segunda cópia perderia a
   * distinção no primeiro ajuste. */
  vazio?: ReactNode;
}
