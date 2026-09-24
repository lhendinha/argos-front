import type { ContagemDaImportacao } from "../../../../types";

export interface ProgressoDaGravacaoProps {
  /** `null` é "ainda sem pulso": a barra fica indeterminada, e não some. */
  progresso: ContagemDaImportacao | null;
}
