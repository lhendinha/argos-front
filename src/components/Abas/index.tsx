import { Box, Flex } from "@chakra-ui/react";

import { idDaAba, idDoPainel } from "../../utils/abas";
import { BotaoNu } from "../BotaoNu";
import type { AbasProps } from "./types";

/** Navegação por abas (`.tabs-row` do artifact): sublinhado de 2px na ativa,
 * sobre uma divisória de 1px que atravessa a linha inteira.
 *
 * `role="tablist"` e `aria-selected` são o que faz o leitor de tela anunciar
 * "aba 2 de 5" em vez de ler cinco botões soltos.
 *
 * ⚠️ `aria-controls`, junto com `PainelDaAba`: sem ele o leitor anuncia as
 * abas mas não sabe QUAL painel cada uma comanda -- e
 * quem navega por teclado não tem como pular da aba pro conteúdo dela. Os
 * ids saem de `utils/abas`, compartilhados com o painel.
 */
export default function Abas<T extends string>({ abas, ativa, onMudar, grupo }: AbasProps<T>) {
  return (
    /* 🔴 A faixa ROLA quando as abas não cabem, e não quebra em duas linhas:
       aba na segunda linha desalinha o sublinhado da ativa da divisória que
       ele deveria encostar, e o conjunto deixa de se ler como uma régua.
       Rolar é o que o celular já faz em toda barra de abas.
       Medido: era esta faixa que punha `/grupo` em 688px e `/financeiro` em
       395 -- os dois maiores estouros que sobraram depois da casca.

       ⚠️ A barra de rolagem some: ela apareceria por cima da divisória e
       roubaria 15px de altura da faixa em navegador que a desenha. O gesto
       de arrastar e o `overflow` continuam lá.

       ⚠️ Sem `scroll-snap`: com abas de larguras diferentes o encaixe para
       no meio de um rótulo tão frequentemente quanto no começo dele. */
    <Box
      mb="18px"
      overflowX="auto"
      css={{
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      <Flex
        role="tablist"
        gap="4px"
        /* 🔴 A divisória fica AQUI, no conteúdo que rola, e não na caixa que
           recorta: o sublinhado da ativa a encosta por `mb: -1px`, e margem
           negativa contra a borda de quem recorta é justamente o que o
           recorte come. `minW: 100%` mantém a linha atravessando a faixa
           inteira mesmo quando as abas ocupam menos que isso -- na tela larga
           o desenho é o mesmo de antes. */
        w="max-content"
        minW="100%"
        borderBottomWidth="1px"
        borderBottomColor="border"
      >
        {abas.map((aba) => {
          const selecionada = aba.id === ativa;
          return (
            <BotaoNu
              key={aba.id}
              id={idDaAba(grupo, aba.id)}
              role="tab"
              type="button"
              aria-selected={selecionada}
              aria-controls={idDoPainel(grupo, aba.id)}
              onClick={() => onMudar(aba.id)}
              flex="0 0 auto"
              whiteSpace="nowrap"
              p="11px 4px"
              /* 🔴 44px no apontador grosso. Medida: com 11px de recuo a aba
                 fica em 42 -- dois pixels da régua de toque, em TODA tela com
                 abas. Um pixel a mais em cima e embaixo fecha a conta, e a
                 divisória desce junto com ela: no apontador fino nada muda. */
              css={{ "@media (pointer: coarse)": { paddingBlock: "12px" } }}
              mr="22px"
              mb="-1px"
              fontSize="13.5px"
              fontWeight="700"
              /* `normal`, como o `<button>` do navegador: com a altura de
                 linha do corpo (1.45) a aba ficava 2px mais alta que a do
                 artifact, e a divisória de baixo saía do lugar. */
              lineHeight="normal"
              color={selecionada ? "brand.darker" : "fg.subtle"}
              borderBottomWidth="2px"
              borderBottomColor={selecionada ? "fg.brand" : "transparent"}
              _hover={{ color: selecionada ? "brand.darker" : "fg" }}
            >
              {aba.rotulo}
            </BotaoNu>
          );
        })}
      </Flex>
    </Box>
  );
}
