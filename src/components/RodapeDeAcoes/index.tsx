import { Flex } from "@chakra-ui/react";

import { TELA_APERTADA_PARA_DIALOGO } from "../../constants";
import type { RodapeDeAcoesProps } from "./types";

/** Rodapé de ações de modal ou de formulário em página
 * (`.modal-foot` / `.form-actions-foot` do artifact -- mesmo layout, dois
 * nomes lá).
 *
 * Diferente do `RodapeDeFiltro`: aquele é do painel de filtro (10px 12px,
 * gap 8) e este é de formulário (16px 22px, gap 10). Parecem o mesmo até
 * medir.
 */
export default function RodapeDeAcoes({ children }: RodapeDeAcoesProps) {
  return (
    <Flex
      justify="flex-end"
      /* 🔴 Quebra quando não couber: o modal de honorário tem TRÊS botões
         ("Cancelar", "Salvar e adicionar outra", "Salvar") e eles somam mais
         que a largura da folha num celular -- o "Cancelar" saía pela
         esquerda, fora do próprio modal. Com a quebra eles descem em vez de
         sair, e `flex-end` mantém a ordem de leitura: o que conclui fica por
         último e mais perto do polegar. */
      wrap="wrap"
      gap="10px"
      p="16px 22px"
      borderTopWidth="1px"
      borderTopColor="border.subtle"
      /* ⚠️ Na tela apertada os botões dividem a fileira. Só com a quebra
         acima, a segunda fileira ficava com um botão solto à direita e a
         quebra parecia acidente; dividindo a largura, as duas fileiras se
         leem como escolha. O recuo também diminui: 22px de cada lado numa
         folha de 360 são 44 de respiro num espaço que não tem. */
      css={{
        [`@media ${TELA_APERTADA_PARA_DIALOGO}`]: {
          padding: "12px 16px",
          "& > *": { flex: "1 1 auto" },
        },
      }}
    >
      {children}
    </Flex>
  );
}
