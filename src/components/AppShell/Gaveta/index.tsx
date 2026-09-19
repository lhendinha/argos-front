import { Box, Flex } from "@chakra-ui/react";
import { useEffect } from "react";

import type { GavetaProps } from "./types";

/** O menu deslizando sobre a tela, onde não há espaço para ele fixo.
 *
 * 🔴 **Não desmonta quando fecha** -- sai de cena por `transform`. Desmontar
 * faria a navegação remontar a cada abertura, e com ela a consulta do
 * contador de não lidos; a gaveta piscaria o número a cada gesto.
 * `visibility` acompanha o deslocamento para que o conteúdo fora de cena
 * não receba Tab nem seja lido em voz alta.
 *
 * 🔴 **O topo dela fica VAZIO de propósito.** O botão que a fecha é o mesmo
 * da barra do topo, que continua visível por cima: o controle não muda de
 * lugar, só de desenho (`≡` vira `✕`). Um segundo botão aqui dentro daria
 * dois alvos para o mesmo gesto, em pontos diferentes.
 *
 * ⚠️ **Escape fecha.** É o par do clique na cortina, e o único caminho de
 * quem usa teclado num aparelho com teclado acoplado.
 *
 * ⚠️ A largura é fluida (`min(88vw, 320px)`): em 360px ela deixa 43px de
 * conteúdo à mostra, o que diz que há tela atrás; num tablet estreito ela
 * para de crescer, porque menu não precisa de mais que isso.
 */
export default function Gaveta({ aberta, onFechar, children }: GavetaProps) {
  useEffect(() => {
    if (!aberta) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberta, onFechar]);

  return (
    <>
      <Box
        data-fora-da-impressao
        position="fixed"
        inset="0"
        zIndex="30"
        bg="rgba(15,25,35,.45)"
        opacity={aberta ? 1 : 0}
        visibility={aberta ? "visible" : "hidden"}
        transition="opacity .18s ease, visibility .18s ease"
        onClick={onFechar}
        aria-hidden="true"
      />
      <Flex
        data-fora-da-impressao
        direction="column"
        position="fixed"
        top="3px"
        left="0"
        bottom="0"
        zIndex="31"
        w="min(88vw, 320px)"
        bg="bg.surface"
        borderRightWidth="1px"
        borderRightColor="border"
        boxShadow="md"
        transform={aberta ? "translateX(0)" : "translateX(-100%)"}
        visibility={aberta ? "visible" : "hidden"}
        transition="transform .18s ease, visibility .18s ease"
        /* A gaveta nasce logo abaixo da barra do topo, e não sob ela: o
           botão que a fecha precisa continuar alcançável com ela aberta. */
        pt="60px"
      >
        {children}
      </Flex>
    </>
  );
}
