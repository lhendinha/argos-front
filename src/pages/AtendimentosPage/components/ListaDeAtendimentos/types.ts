import type { Atendimento } from "../../../../types";
import type { ReactNode } from "react";

export interface ListaDeAtendimentosProps {
  atendimentos: Atendimento[];
  /** O estado vazio, montado pela página -- ele distingue "vazio por filtro"
   * de "vazio de verdade", e uma segunda cópia perderia a distinção no
   * primeiro ajuste. */
  vazio: ReactNode;
  subgrupoNome: (id: string) => string;
  onAbrir: (atendimento: Atendimento) => void;
}
