import { Flex, Menu, Portal, Stack, Text } from "@chakra-ui/react";

import Botao from "../../../../components/Botao";
import { IconeChevron } from "../../../../components/Icons";
import Ponto from "../../../../components/Ponto";
import { Z_INDEX_MENU_PORTAL } from "../../../../constants";
import { PAINEL_DE_MENU, POSICAO_DO_MENU } from "../../../../theme/menu";
import { tipografia } from "../../../../theme/tokens";
import { OPCOES_DE_NOVO_LANCAMENTO } from "../../constants";
import type { MenuDeNovoLancamentoProps } from "./types";

/** O botão "+ Novo lançamento" e as quatro portas que ele abre.
 *
 * 🔴 **Um menu, e não quatro botões.** Os quatro formulários são diferentes
 * o bastante para não caberem num só (honorário tem parcelas e fatura;
 * transferência não tem categoria nem cliente), e quatro botões no cabeçalho
 * fariam a pessoa escolher antes de saber o que cada um pede. A frase abaixo
 * de cada nome é o que responde isso -- ela vem do artefato.
 *
 * 🔴 **É o `Menu` do Chakra, e não um painel posicionado à mão.** Ele era
 * feito à mão, com `position: absolute; right: 0` e um gancho de fechar ao
 * clicar fora. No celular isso punha o painel de 220px em **-29px** -- 29
 * pixels fora da tela, medido em 390 e em 360. Quem viu foi o usuário; a
 * régua do mobile não abre menu nenhum.
 *
 * 🔴 **E trocar `right` por `left` não resolvia: trocava de erro.** Medido de
 * 360 a 1440, o botão muda de lado -- abaixo de ~440px o cabeçalho quebra e
 * ele encosta na borda esquerda; acima, ele é o item da direita. Pela
 * esquerda o painel passava 13px da borda direita no desktop, e um ponto de
 * virada escolhido a dedo errava em 470px, porque a quebra do cabeçalho é do
 * CONTEÚDO e não de um `breakpoint`. O posicionador do Chakra vira sozinho
 * quando falta espaço, que é a única resposta que não depende de adivinhar.
 *
 * ⚠️ Fecha ao escolher e ao clicar fora -- agora pelo próprio `Menu`, e não
 * por um gancho nosso. Um menu que continua aberto por cima do modal que ele
 * abriu rouba o clique do primeiro campo.
 */
export default function MenuDeNovoLancamento({ onEscolher }: MenuDeNovoLancamentoProps) {
  return (
    <Menu.Root positioning={POSICAO_DO_MENU}>
      <Menu.Trigger asChild>
        <Botao>
          + Novo lançamento
          <IconeChevron />
        </Botao>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner zIndex={Z_INDEX_MENU_PORTAL}>
          {/* ⚠️ `width` fixo, e não `minWidth`: o painel à mão era absoluto e
              encolhia para 220px; o `Menu.Content` do Chakra cresce até o
              conteúdo e media 351. Medido nos dois, antes e depois. */}
          <Menu.Content css={{ ...PAINEL_DE_MENU, width: "220px", minWidth: "220px" }}>
            {OPCOES_DE_NOVO_LANCAMENTO.map((opcao) => (
              <Menu.Item
                key={opcao.forma}
                value={opcao.forma}
                onSelect={() => onEscolher(opcao.forma)}
                /* ⚠️ As medidas do painel ANTIGO, e não `OPCAO_DE_MENU`:
                   aquela usa 8px 12px de recuo e esta usava 9px 10px. O
                   componente trocou de dono, não de desenho. */
                css={{
                  display: "block",
                  width: "100%",
                  padding: "9px 10px",
                  /* ⚠️ O `Menu.Item` do Chakra impõe `line-height: 20px`, e os
                     dois textos de dentro (13.5 e 11.5px) HERDAVAM: cada item
                     crescia 7px e o painel ia de 281 para 306. `normal`
                     derrubava para 263. O painel à mão herdava a entrelinha
                     do corpo -- medida em 20.3px, que é o
                     `tipografia.alturaLinha` do tema. */
                  lineHeight: tipografia.alturaLinha,
                  borderRadius: "sm",
                  textAlign: "left",
                  cursor: "pointer",
                  _hover: { bg: "bg.canvas" },
                }}
              >
                <Flex gap="10px" align="flex-start">
                  <Ponto tom={opcao.tom} noTopo />
                  <Stack gap="0">
                    <Text fontSize="13.5px" fontWeight="600">
                      {opcao.rotulo}
                    </Text>
                    <Text fontSize="11.5px" color="fg.subtle">
                      {opcao.descricao}
                    </Text>
                  </Stack>
                </Flex>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
