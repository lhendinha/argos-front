import { Flex } from "@chakra-ui/react";

import BotaoDeIcone from "../../BotaoDeIcone";
import { IconeMenu, IconeX } from "../../Icons";
import MarcaArgos from "../../MarcaArgos";
import MenuUsuario from "../MenuUsuario";
import SinoDeNotificacoes from "./SinoDeNotificacoes";
import type { TopbarProps } from "./types";

/** Barra superior da área autenticada: 60px de altura, divisória de 1px
 * embaixo, o botão do menu e a marca à esquerda, e as ações à direita.
 *
 * 🔴 **Ela atravessa a tela inteira, por cima do menu lateral** -- e é isso
 * que mantém o botão do menu no MESMO ponto em qualquer largura. Enquanto a
 * barra começava depois do menu, o botão nascia à direita da marca no
 * desktop e à esquerda dela no celular: o mesmo gesto em dois lugares, o que
 * o usuário notou antes de nós.
 *
 * 🔴 **A marca mora aqui, e não no topo do menu.** É consequência da mesma
 * escolha: com o menu recolhido, uma marca dentro dele desapareceria junto,
 * e a tela ficaria sem identificação. Aqui ela é a única, e não muda de
 * lugar quando o menu abre ou fecha.
 *
 * ⚠️ O ícone alterna entre `IconeMenu` e `IconeX` no mesmo botão, em vez de
 * um segundo botão dentro da gaveta: o controle não muda de posição, só de
 * desenho -- fechar é onde abrir estava. Mas só com a GAVETA por cima: com o
 * menu fixo aberto não há nada a fechar, e o `✕` ali lia como o fechar da
 * página.
 *
 * `sticky top 3px` pra ficar logo abaixo da faixa da marca, que é fixa.
 */
export default function Topbar({ onSair, onAlternarMenu, menuAberto, rotuloDoBotao, sobreposto }: TopbarProps) {
  return (
    <Flex
      /* Some no papel, como o menu lateral. */
      data-fora-da-impressao
      as="header"
      align="center"
      gap="10px"
      h="60px"
      flex="0 0 auto"
      /* Recuo menor à esquerda: quem dá o respiro é a área de toque do
         próprio botão, e somar os dois o afastaria da borda. */
      pl="10px"
      pr="16px"
      bg="bg.surface"
      borderBottomWidth="1px"
      borderBottomStyle="solid"
      borderBottomColor="border"
      position="sticky"
      top="3px"
      /* 🔴 ACIMA da gaveta (30 na cortina, 31 no painel), e não abaixo: é
         aqui que mora o botão que a fecha. Com 20, a gaveta subia por cima
         da barra e o `✕` sumia atrás dela -- visto na tela, e é o oposto do
         que o botão único se propõe a fazer. Abaixo da faixa da marca (40),
         que é a única coisa que fica sempre no topo. */
      zIndex="32"
    >
      {/* ⚠️ O `css` dimensiona o `IconeX`, que não tem tamanho próprio ao
          contrário do `IconeMenu`. `BotaoDeIcone` MESCLA este objeto com o
          alvo de toque dele, então passá-lo não apaga os 44px. */}
      <BotaoDeIcone
        rotulo={rotuloDoBotao}
        aria-expanded={menuAberto}
        onClick={onAlternarMenu}
        color="fg"
        css={{ "& svg": { width: "18px", height: "18px" } }}
      >
        {sobreposto ? <IconeX /> : <IconeMenu />}
      </BotaoDeIcone>

      <MarcaArgos />

      <Flex align="center" gap="6px" ml="auto">
        <SinoDeNotificacoes />
        <MenuUsuario onSair={onSair} />
      </Flex>
    </Flex>
  );
}
