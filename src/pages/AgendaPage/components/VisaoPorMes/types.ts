import type { Tarefa } from "../../../../types";

export interface VisaoPorMesProps {
  data: Date;
  isoDeHoje: string;
  /** O dia que o cartão lateral está mostrando. */
  isoSelecionado: string;
  porDia: Map<string, Tarefa[]>;
  onEscolherDia: (iso: string) => void;
}
