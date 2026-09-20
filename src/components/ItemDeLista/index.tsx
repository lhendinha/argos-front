import { Box, Flex } from "@chakra-ui/react";

import { BotaoNu } from "../BotaoNu";
import type { ItemDeListaProps } from "./types";

/** Um item clicável de várias linhas dentro de um cartão de lista -- a forma
 * que a linha de tabela assume onde não há largura para colunas.
 *
 * 🔴 **Divisória, e não cartão próprio.** Estes itens vivem DENTRO do
 * `CartaoDeTabela`, que já é um cartão branco com borda: dar borda a cada um
 * empilharia cartão dentro de cartão. É a mesma forma que `LinhaDeAtendimento`
 * e o Histórico já usam, e é o que mantém as listas do sistema parecidas
 * entre si.
 *
 * ⚠️ `<button>` de verdade, e não uma `div` com `onClick`: a linha de tabela
 * que ele substitui é alcançável por Tab e responde a Enter, e perder isso
 * no celular deixaria a lista inteira fora do alcance de quem navega por
 * teclado -- que existe no celular, em teclado acoplado e em leitor de tela.
 *
 * ⚠️ As ações ficam FORA do botão, como irmãs -- ver `acoes` no `types`.
 *
 * ⚠️ Difere de `LinhaDeLista`: aquele é uma fileira horizontal de UMA linha,
 * com ícone e ações, e não é clicável.
 */
export default function ItemDeLista({ onAbrir, rotulo, acoes, children }: ItemDeListaProps) {
  return (
    <Flex
      align="center"
      gap="10px"
      borderBottomWidth="1px"
      borderBottomStyle="solid"
      borderBottomColor="border.subtle"
      _last={{ borderBottomWidth: 0 }}
    >
      <BotaoNu
        type="button"
        onClick={onAbrir}
        aria-label={rotulo}
        display="block"
        w="100%"
        textAlign="left"
        flex="1 1 auto"
        minW="0"
        p="14px 10px"
        _hover={{ bg: "bg.canvas" }}
        _focusVisible={{ outline: "2px solid", outlineColor: "fg.brand", outlineOffset: "-2px" }}
      >
        {children}
      </BotaoNu>
      {acoes && (
        <Box flex="0 0 auto" pr="10px">
          {acoes}
        </Box>
      )}
    </Flex>
  );
}
