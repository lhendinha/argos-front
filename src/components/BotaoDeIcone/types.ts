import type { HTMLChakraProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

/** ⚠️ Estende as props do `<button>` do Chakra porque o botão do menu, na
 * barra do topo, precisa passar `aria-expanded`, cor e o `css` que
 * dimensiona um ícone sem tamanho próprio (`IconeX`). Antes a interface
 * listava quatro campos e qualquer um desses era erro de tipo no chamador. */
export interface BotaoDeIconeProps extends HTMLChakraProps<"button"> {
  rotulo: string;
  /** Ponto vermelho de "tem coisa nova", como no artifact. */
  comAviso?: boolean;
  children: ReactNode;
}
