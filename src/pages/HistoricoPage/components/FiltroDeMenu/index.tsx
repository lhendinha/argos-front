import { Menu, Portal, Text } from "@chakra-ui/react";

import { PilulaDeFiltro } from "../../../../components";
import { CONTAGEM_NA_OPCAO, OPCAO_COM_CONTAGEM, OPCAO_DE_MENU, OPCAO_DE_MENU_ATIVA, PAINEL_DE_MENU } from "../../../../theme/menu";
import { formatarQuantidade } from "../../../../utils";
import type { FiltroDeMenuProps } from "./types";

/** Pílula de filtro com menu, no formato do Histórico.
 *
 * 🔴 UM menu para os filtros de tipo, falha e período: três cópias do mesmo
 * menu divergiriam no primeiro ajuste de estilo -- e o realce da opção
 * escolhida, que é o que impede a pessoa de achar que não há filtro ligado,
 * some numa cópia sem ninguém notar.
 *
 * ⚠️ **Filtro ligado tem que PARECER ligado.** A pílula fica acesa sempre
 * que o valor difere do neutro -- e a tela abre em "Movimentações", já
 * filtrada. Filtro invisível faz a pessoa ver uma lista incompleta achando
 * que está vendo tudo. Pelo mesmo motivo a opção escolhida é realçada dentro
 * do menu.
 */
export default function FiltroDeMenu<T extends string | number | boolean>({
  opcoes,
  valor,
  onMudar,
  contagens,
}: FiltroDeMenuProps<T>) {
  const neutro = opcoes[0];
  const atual = opcoes.find((o) => o.valor === valor) ?? neutro;
  const ativo = valor !== neutro.valor;
  const contagemAtual = contagens?.[atual.id];

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <PilulaDeFiltro ativo={ativo}>
          {atual.rotulo}
          {/* O número só na pílula LIGADA: no neutro ele repetiria o resumo logo abaixo da barra. */}
          {ativo && contagemAtual != null && (
            <Text as="span" css={{ ...CONTAGEM_NA_OPCAO, color: "inherit", fontWeight: "600", letterSpacing: "0" }}>
              · {formatarQuantidade(contagemAtual)}
            </Text>
          )}
        </PilulaDeFiltro>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content css={PAINEL_DE_MENU}>
            {opcoes.map((o) => (
              <Menu.Item
                key={o.id}
                value={o.id}
                onSelect={() => onMudar(o.valor)}
                css={{
                  ...OPCAO_DE_MENU,
                  ...(o.valor === valor ? OPCAO_DE_MENU_ATIVA : {}),
                  ...(contagens ? OPCAO_COM_CONTAGEM : {}),
                }}
              >
                <span>{o.rotulo}</span>
                {contagens?.[o.id] != null && (
                  <Text as="span" css={CONTAGEM_NA_OPCAO}>
                    {formatarQuantidade(contagens[o.id] as number)}
                  </Text>
                )}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
