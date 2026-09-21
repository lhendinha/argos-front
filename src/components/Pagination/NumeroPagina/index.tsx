import { BotaoNu } from "../../BotaoNu";
import type { NumeroPaginaProps } from "./types";

/** Número de página (`.pagination-numero` do artifact): sem borda, fonte
 * mono, e o atual em cheio na cor da marca.
 *
 * ⚠️ **O rótulo diz "página", o glifo não.** Lido em sequência, um leitor de
 * tela anunciava "1, 2, 3, 4" -- quatro botões sem dizer do quê, encostados
 * no seletor "Por página", que também é número. É o que a paginação do
 * Chakra faz, e a última ela nomeia: saber que 7 é o fim evita tentar a 8. */
export default function NumeroPagina({ numero, atual, ultima, onClick }: NumeroPaginaProps) {
  return (
    <BotaoNu
      type="button"
      onClick={onClick}
      aria-label={ultima ? `última página, página ${numero}` : `página ${numero}`}
      aria-current={atual ? "page" : undefined}
      display="flex"
      alignItems="center"
      justifyContent="center"
      minW="30px"
      h="30px"
      /* 44px no apontador grosso -- ver `Botao`. */
      css={{ "@media (pointer: coarse)": { minWidth: "44px", minHeight: "44px" } }}
      px="6px"
      borderRadius="sm"
      fontFamily="mono"
      fontSize="13px"
      fontWeight="700"
      bg={atual ? "fg.brand" : "transparent"}
      color={atual ? "white" : "fg.muted"}
      _hover={atual ? undefined : { bg: "border.subtle", color: "fg" }}
    >
      {numero}
    </BotaoNu>
  );
}
