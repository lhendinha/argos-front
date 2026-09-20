import type { ReactNode } from "react";

export interface RolagemHorizontalProps {
  /** O nome da região, para quem navega por teclado e leitor de tela ouvir
   * o que está prestes a rolar. */
  rotulo: string;
  /** A frase que aparece SÓ quando ainda há conteúdo à direita -- "Arraste a
   * tabela para ver os outros meses". Sem ela, ficam só a sombra e o
   * esmaecido. */
  dica?: string;
  children: ReactNode;
}
