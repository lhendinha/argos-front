import type { NaoCobrada } from "../../../../types";

export interface ItemNaoCobradoProps {
  despesa: NaoCobrada;
  /** O id que está voltando a ser cobrado agora -- trava o botão daquela
   * despesa, e só dela. */
  voltando: string | null;
  onAbrir: (lancamentoId: string) => void;
  onVoltarACobrar: (despesa: NaoCobrada) => void;
}
