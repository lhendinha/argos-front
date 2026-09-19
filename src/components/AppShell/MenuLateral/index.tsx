import { Box, Stack } from "@chakra-ui/react";

import { ITENS_NAVEGACAO } from "../../../constants";
import { useNaoLidosDoHistorico } from "../../../hooks/useNaoLidosDoHistorico";
import { papelAtende } from "../../../services";
import BotaoDeSuporte from "../BotaoDeSuporte";
import ItemMenu from "../ItemMenu";
import type { MenuLateralProps } from "./types";

/** O CONTEÚDO do menu: a navegação e o pé com o Suporte.
 *
 * 🔴 **A moldura não está mais aqui** -- largura, borda, `sticky` e altura
 * são de quem hospeda: o `AppShell` quando o menu é fixo, a `Gaveta` quando
 * ele desliza sobre a tela. As duas hospedagens querem larguras e alturas
 * diferentes, e enquanto a moldura morava aqui só uma delas podia estar
 * certa.
 *
 * 🔴 **A marca saiu daqui para a barra do topo.** Com o menu recolhível, uma
 * marca dentro dele sumiria junto e a tela ficaria sem identificação.
 *
 * Quem está logado e o "Sair" ficam no menu do usuário, na topbar -- o
 * rodapé daqui já foi a casa deles na Fase 0, quando ainda não havia
 * topbar. Duas portas pra mesma ação em telas diferentes é confusão. */
export default function MenuLateral({ onNavegar }: MenuLateralProps = {}) {
  const itens = ITENS_NAVEGACAO.filter(
    (i) => !i.pendente && (!i.minimo || papelAtende(i.minimo)),
  );
  /* Aqui, e não no item: o menu está em toda tela, e é o único lugar de onde o contador aparece em todas. */
  const naoLidosDoHistorico = useNaoLidosDoHistorico();

  return (
    <>
      <Stack
        as="nav"
        aria-label="Navegação principal"
        gap="0"
        flex="1"
        minH="0"
        overflowY="auto"
        p="10px 12px"
        onClick={onNavegar}
      >
        {itens.map((item) => (
          <ItemMenu
            key={item.caminho}
            item={item}
            contador={item.caminho === "/historico" ? naoLidosDoHistorico : undefined}
          />
        ))}
      </Stack>

      {/* `.sidebar-foot` do artifact: separado da navegação por uma
          divisória, porque Suporte não é uma tela do sistema -- é uma saída
          dele.

          ⚠️ O recuo de baixo soma a área segura do aparelho: no iPhone com
          indicador de início, um rodapé colado na borda fica por baixo
          dele. `env()` vale zero onde não há recorte, então não precisa de
          condição. */}
      <Box
        p="14px 12px"
        pb="calc(18px + env(safe-area-inset-bottom))"
        borderTopWidth="1px"
        borderTopColor="border.subtle"
      >
        <BotaoDeSuporte />
      </Box>
    </>
  );
}
