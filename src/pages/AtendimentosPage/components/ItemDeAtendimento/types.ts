import type { Atendimento } from "../../../../types";

export interface ItemDeAtendimentoProps {
  atendimento: Atendimento;
  /** Traduz `subgrupo_id` em nome -- vem da PÁGINA, numa consulta só para a
   * lista inteira em vez de uma por item. */
  subgrupoNome: (id: string) => string;
  onAbrir: (atendimento: Atendimento) => void;
}
