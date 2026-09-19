import { Box, Flex } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";

import { useMenuDaCasca } from "../../hooks/useMenuDaCasca";
import Gaveta from "./Gaveta";
import MenuLateral from "./MenuLateral";
import Topbar from "./Topbar";
import type { AppShellProps } from "./types";

/** Moldura do app autenticado: faixa da marca, barra do topo atravessando a
 * tela, menu (fixo ou em gaveta) e a área de conteúdo, que o router
 * preenche via `<Outlet />`.
 *
 * 🔴 **A barra do topo vem ANTES da linha do menu, e não ao lado dele.** É o
 * que mantém o botão do menu no mesmo ponto em qualquer largura -- ver o
 * docstring da `Topbar`. Enquanto o menu era o primeiro filho de um flex
 * horizontal, a barra começava depois dele e o botão mudava de lugar entre
 * desktop e celular.
 *
 * 🔴 **Onde não cabe menu fixo, ele vira gaveta e o conteúdo fica com a
 * largura inteira.** Medi: com o menu de 236px fixo, `main` ficava com 124px
 * de uma tela de 360 -- 34%. Quem decide é `useMenuDaCasca`, por espaço
 * disponível e não por aparelho.
 *
 * 🔴 **Com a gaveta aberta, o resto vira `inert`.** É a mesma escolha do
 * `Modal`: o Tab deixa de passear pela tela de trás sem armadilha de foco
 * nenhuma, e o conteúdo coberto sai da árvore de acessibilidade. A `Topbar`
 * fica de fora do `inert` porque é dela o botão que fecha a gaveta.
 *
 * ⚠️ **A moldura leva `data-fora-da-impressao`** -- a faixa aqui, e o menu, a
 * barra do topo e a gaveta cada um na PRÓPRIA raiz. Quem imprime uma tela do
 * Argos quer o documento, não a moldura; a regra que a esconde é uma só, no
 * `@media print` do tema.
 *
 * ⚠️ **`100dvh`, não `100vh`.** Medido no iPhone SE: `100vh` dá 589px
 * enquanto a área visível tem 549 -- 40px do layout ficam sob a barra do
 * Safari. `dvh` acompanha a barra que aparece e some.
 */
export default function AppShell({ onSair }: AppShellProps) {
  const menu = useMenuDaCasca();
  const gavetaAberta = !menu.fixo && menu.aberto;

  return (
    <>
      <Box
        data-fora-da-impressao
        position="fixed"
        top="0"
        left="0"
        right="0"
        h="3px"
        zIndex="40"
        bgGradient="to-r"
        gradientFrom="brand"
        gradientTo="brand.darker"
      />
      <Flex direction="column" minH="100dvh" pt="3px" bg="bg.canvas">
        <Topbar
          onSair={onSair}
          onAlternarMenu={menu.alternar}
          menuAberto={menu.aberto}
          rotuloDoBotao={menu.aberto ? "Recolher menu" : "Abrir menu"}
        />

        <Flex flex="1" minH="0" {...(gavetaAberta ? { inert: "" } : {})}>
          {menu.fixo && menu.aberto && (
            <Flex
              data-fora-da-impressao
              as="aside"
              direction="column"
              /* Fluida: para de encolher antes de espremer os rótulos, e
                 para de crescer quando já cabe o mais longo deles. */
              w="clamp(212px, 18vw, 264px)"
              flex="0 0 auto"
              bg="bg.surface"
              borderRightWidth="1px"
              borderColor="border"
              position="sticky"
              /* Logo abaixo da faixa de 3px MAIS os 60px da barra do topo,
                 que agora fica acima dele. */
              top="63px"
              h="calc(100dvh - 63px)"
            >
              <MenuLateral />
            </Flex>
          )}

          {/* 🔴 O container das consultas de container da área de conteúdo.
              É contra a largura DELE que `main` calcula o recuo -- e não
              contra a da janela, que não muda quando o menu é recolhido. */}
          <Box flex="1" minW="0" containerType="inline-size">
            <Box
              as="main"
              w="100%"
              maxW="1400px"
              mx="auto"
              pt="clamp(16px, 3cqi, 26px)"
              px="clamp(16px, 4cqi, 32px)"
              pb="60px"
            >
              <Outlet />
            </Box>
          </Box>
        </Flex>
      </Flex>

      {!menu.fixo && (
        <Gaveta aberta={menu.aberto} onFechar={menu.fechar}>
          <MenuLateral onNavegar={menu.fechar} />
        </Gaveta>
      )}
    </>
  );
}
