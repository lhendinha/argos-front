import { Button } from "@chakra-ui/react";

import { BOTAO } from "../../theme/painelFiltro";
import { CORES_DO_BOTAO } from "../../theme/botao";
import type { BotaoProps } from "./types";

/** O botão do sistema (`.btn` do artifact): 9px 16px, raio 6, 13px/700.
 *
 * Um componente só para as quatro variantes -- antes o rodapé dos filtros
 * tinha a própria cópia dessas medidas, e os modais usavam as classes do
 * design antigo. Três fontes para o mesmo botão divergem no primeiro ajuste.
 */
export default function Botao({ variante = "primario", children, ...resto }: BotaoProps) {
  return (
    <Button
      type="button"
      display="inline-flex"
      alignItems="center"
      gap={BOTAO.gap}
      h="auto"
      p={BOTAO.padding}
      borderRadius={BOTAO.raio}
      borderWidth="1px"
      fontSize={BOTAO.fonte}
      fontWeight={BOTAO.peso}
      whiteSpace="nowrap"
      /* `.btn svg{width:15px;height:15px}` do artifact. Precisa ser
         declarado: a receita do `Button` do Chakra dimensiona os SVGs
         descendentes e vence o atributo `width` do próprio ícone -- a
         lixeira do Excluir saía com 20px. */
      /* 🔴 44px de altura onde o apontador é GROSSO. Medido: o botão tem
         40px, que é pouco para o dedo e nada para quem tem a mão trêmula. A
         régua é o APONTADOR e não a largura da tela -- um tablet largo
         continua sendo tocado, e um celular com mouse não precisa do alvo
         maior. `minHeight`, e não `height`: o botão que quebra em duas
         linhas continua crescendo. */
      css={{
        "& svg": { width: "15px", height: "15px" },
        "@media (pointer: coarse)": { minHeight: "44px" },
      }}
      /* Dá nome à variante no DOM: cor não se afere em jsdom, e é assim que um
         teste sabe qual botão é o primário. Mesmo recurso do `data-tipo` do
         `Aviso`. */
      data-variante={variante}
      {...CORES_DO_BOTAO[variante]}
      {...resto}
    >
      {children}
    </Button>
  );
}
