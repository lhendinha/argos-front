import type { RegistroDeAtendimento } from "../../../../types";

export interface LinhaDoTempoProps {
  /** Os registros carregados, do mais antigo ao mais novo. */
  registros: RegistroDeAtendimento[];
  /** Quantos registros o atendimento tem ao todo -- o que a frase do topo conta. */
  quantidade: number;
  /** Há registros antes do primeiro da tela. */
  temAnteriores: boolean;
  carregandoAnteriores: boolean;
  onVerAnteriores: () => void;
}

/** Onde estava o primeiro registro da tela quando a pessoa pediu os anteriores. */
export interface AncoraDaLinhaDoTempo {
  chave: string;
  topo: number;
  /** Quantos registros havia: enquanto for o mesmo número, os anteriores não chegaram. */
  quantos: number;
}
