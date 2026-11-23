import type { Tarefa } from "../../../../types";

export interface CartaoDoDiaProps {
  /** O dia que o cartão mostra: hoje por padrão, ou o clicado na grade. */
  dia: Date;
  ehHoje: boolean;
  tarefas: Tarefa[];
  carregando: boolean;
  subgrupoNome: (id: string) => string;
  assuntoDoAtendimento: (id: string) => string | undefined;
  onAbrir: (tarefa: Tarefa) => void;
  /** Leva para a visão "Por dia" deste dia. */
  onAbrirDia: () => void;
}
