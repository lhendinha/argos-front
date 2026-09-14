import { Button } from "@chakra-ui/react";
import type { BotaoDeTextoProps } from "./types";

/** Botão sem moldura, na cor da marca (`.btn-text` do artifact). Usado no
 * "← Voltar" das telas de detalhe. */
export default function BotaoDeTexto({ onClick, children, desabilitado }: BotaoDeTextoProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      display="inline-flex"
      alignItems="center"
      gap="7px"
      h="auto"
      p="9px 6px"
      pl="0"
      bg="transparent"
      color="fg.brand"
      fontSize="13px"
      fontWeight="700"
      _hover={{ textDecoration: "underline" }}
      /* Desabilitado é texto cinza e sem sublinhado: um link apagado que sublinha no hover promete um clique que não há. */
      _disabled={{ color: "fg.subtle", cursor: "default", opacity: 1, _hover: { textDecoration: "none" } }}
    >
      {children}
    </Button>
  );
}
