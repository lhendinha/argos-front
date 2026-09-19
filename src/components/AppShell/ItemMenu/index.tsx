import { Box, HStack, Text } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";

import { contarFormatado, formatarQuantidade } from "../../../utils";
import { ICONES_MENU } from "../icones";
import type { ItemMenuProps } from "./types";

/** Um item do menu lateral.
 *
 * `NavLink` com `end` na raiz: sem `end`, o caminho `/` casaria com **todas**
 * as rotas (`/kanban`, `/processos`…) e a Área de trabalho ficaria marcada
 * como ativa o tempo todo.
 *
 * O estado ativo é derivado no render, a partir do `isActive` que o router
 * entrega -- não guardado em estado próprio, que é como esse tipo de menu
 * costuma dessincronizar do endereço.
 */
export default function ItemMenu({ item, contador }: ItemMenuProps) {
  const Icone = ICONES_MENU[item.icone];

  return (
    <NavLink
      to={item.caminho}
      end={item.caminho === "/"}
      style={{ display: "block" }}
      /* O número entra no NOME do link: a pílula é visual, e "Histórico" sozinho não diz que há o que ler. */
      aria-label={contador ? `${item.rotulo}, ${contarFormatado(contador, "envio não lido", "envios não lidos")}` : undefined}
    >
      {({ isActive }) => (
        /* `.nav-item` do artifact: 9px 10px, gap 11, 13.5px/600. O ativo
           ganha, além do fundo, uma barra de 3px encostada na borda da
           barra lateral -- é o `::before` de lá, em `left: -12px`, que só
           funciona porque a lista tem 12px de padding. */
        <HStack
          position="relative"
          gap="11px"
          p="9px 10px"
          /* 44px no apontador grosso -- ver `Botao`. São dez itens
             empilhados na gaveta: 40px deixa 4px entre os alvos, e errar o
             vizinho leva a pessoa para a tela errada. */
          css={{ "@media (pointer: coarse)": { minHeight: "44px" } }}
          mb="2px"
          borderRadius="sm"
          color={isActive ? "brand.darker" : "fg.muted"}
          bg={isActive ? "bg.brand.subtle" : "transparent"}
          fontWeight="600"
          _hover={{ bg: isActive ? "bg.brand.subtle" : "border.subtle", color: isActive ? "brand.darker" : "fg" }}
          _before={
            isActive
              ? {
                  content: '""',
                  position: "absolute",
                  left: "-12px",
                  top: "6px",
                  bottom: "6px",
                  width: "3px",
                  borderRadius: "2px",
                  bg: "fg.brand",
                }
              : undefined
          }
        >
          {Icone && (
            <Box aria-hidden="true" display="flex" color={isActive ? "fg.brand" : "fg.subtle"}>
              <Icone />
            </Box>
          )}
          <Text fontSize="13.5px">{item.rotulo}</Text>
          {/* 🔴 O número EXATO, sem teto -- ao contrário do sino, que para em `MAXIMO_NO_BADGE`: aqui é a fila de leitura,
              e "9+" não diz quanto falta. A pílula cresce com o número ("1.234") sem quebrar o menu. */}
          {contador ? (
            <Box
              as="span"
              aria-hidden="true"
              data-contador
              ml="auto"
              minW="20px"
              h="20px"
              px="6px"
              borderRadius="full"
              bg="brand.darker"
              color="white"
              fontSize="11px"
              fontWeight="800"
              display="inline-grid"
              placeItems="center"
              css={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatarQuantidade(contador)}
            </Box>
          ) : null}
        </HStack>
      )}
    </NavLink>
  );
}
