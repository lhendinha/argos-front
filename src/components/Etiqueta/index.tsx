import { Box } from "@chakra-ui/react";
import type { EtiquetaProps } from "./types";

/** Pílula de estado (`.role-badge` / `.status-badge` do artifact): 11px/800
 * em caixa alta, 3px 9px, totalmente arredondada.
 *
 * Cor E texto, sempre: quem não distingue duas pílulas claras continua
 * lendo "Admin" e "Gerente", "Enviado" e "Falha".
 */
export default function Etiqueta({ cores, children }: EtiquetaProps) {
  return (
    <Box
      as="span"
      display="inline-block"
      fontSize="11px"
      fontWeight="800"
      textTransform="uppercase"
      letterSpacing="0.02em"
      p="3px 9px"
      borderRadius="full"
      whiteSpace="nowrap"
      /* 🔴 Não passa da largura de quem a segura. O `nowrap` acima existe
         para "Aguardando sentença" não virar duas linhas dentro da pílula,
         e sem teto ele torna a etiqueta INDIVISÍVEL: medi um nome de
         subgrupo longo numa linha de Atendimentos e a pílula saiu com 515px
         numa coluna de 282, empurrando a página inteira para 554 numa tela
         de 360. Quem resume já carrega o texto completo no `title`
         (`EtiquetasDeSubgrupo`), então o corte não esconde nada.
         Rótulo curto -- que é a regra, "Admin", "Enviado" -- não encosta
         neste teto e continua idêntico. */
      maxW="100%"
      overflow="hidden"
      textOverflow="ellipsis"
      /* Só desenha a linha quando alguém pede a cor dela -- ver `cores`. */
      borderWidth={cores.borderColor ? "1px" : undefined}
      {...cores}
    >
      {children}
    </Box>
  );
}
