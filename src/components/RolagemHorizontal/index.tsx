import { Box, Flex, Text } from "@chakra-ui/react";

import { useBordasDaRolagem } from "../../hooks/useBordasDaRolagem";
import { IconeSeta } from "../Icons";
import type { RolagemHorizontalProps } from "./types";

/** Conteúdo largo demais para a largura disponível, com o aviso de que ele
 * continua depois da borda.
 *
 * 🔴 **Rolagem horizontal no toque é invisível, e este componente existe
 * para desfazer isso.** Medido no Fluxo de caixa em 390px: 1975px de tabela
 * em 348px visíveis, e nada na tela dizia que havia onze meses à direita --
 * o navegador do celular só desenha a barra enquanto se arrasta. São três
 * sinais, e nenhum sozinho basta: a FRASE diz o que fazer, o ESMAECIDO
 * mostra onde continua, e a SOMBRA da coluna fixa (de quem a tem) mostra
 * que ela está por cima e o resto passa por baixo.
 *
 * 🔴 **Os três só acendem quando são verdade.** Quem cuida disso é o
 * `useBordasDaRolagem`: numa tabela que cabe inteira nada aparece, e no fim
 * da rolagem o esmaecido da direita apaga. Um aviso permanente de "tem
 * mais" é pior que nenhum, porque ensina a ignorá-lo.
 *
 * 🔴 **`tabIndex={0}` com `role="region"`:** sem isso, quem navega por
 * teclado não alcança a rolagem -- não há o que focar dentro da tabela, e
 * as setas do teclado precisam de um elemento focado para rolar alguma
 * coisa. É a 2.1.1 do WCAG, e o preço é um ponto a mais no Tab.
 *
 * ⚠️ Os esmaecidos são `pointer-events: none`: eles cobrem a borda do
 * conteúdo, e sem isto o toque na última coluna cairia neles.
 *
 * ⚠️ Quem tem coluna fixa põe a sombra NA CÉLULA, e não aqui -- só ela sabe
 * onde a coluna termina. Ver `Celula` do fluxo.
 */
export default function RolagemHorizontal({ rotulo, dica, children }: RolagemHorizontalProps) {
  const [medir, bordas] = useBordasDaRolagem();

  return (
    <>
      {dica && bordas.depois && (
        <Flex align="center" gap="7px" p="0 14px 10px" color="fg.muted">
          {/* A seta para a direita é a `IconeSeta` espelhada, como o
              docstring dela manda -- é um desenho só, não dois. */}
          <Box color="fg.subtle" flexShrink="0" transform="scaleX(-1)" aria-hidden="true">
            <IconeSeta />
          </Box>
          <Text fontSize="12px">{dica}</Text>
        </Flex>
      )}

      {/* 🔴 `containerType` para o conteúdo poder se medir contra o que
          está VISÍVEL, e não contra a própria largura. A coluna fixa do
          fluxo usa isso: `40cqw` a limita a 40% do que se vê, o que deixa
          60% para os números -- espaço para pelo menos um mês inteiro ao
          lado do rótulo em 390px, que era o que faltava. Dentro do rolador
          a mesma conta daria 40% de 1975px. */}
      <Box
        position="relative"
        containerType="inline-size"
        /* 🔴 **A declaração de "largo de propósito", para a régua do
           mobile.** Ela cobra toda tabela que passe da própria área visível
           -- foi o defeito que o usuário achou no Fluxo de caixa, com a
           régua marcando 92 de 92 --, e só não cobra quem se declara. O
           lugar certo da declaração é AQUI e não na tabela: este componente
           é a declaração, porque é ele que desenha os três sinais que
           tornam a rolagem utilizável. Tabela larga sem eles continua
           sendo reprovada, que é exatamente a regra que se quer. */
        data-larga=""
      >
        <Box
          ref={medir}
          overflowX="auto"
          /* Quem desenha a sombra da coluna fixa é a célula, que é a única
             que sabe onde a coluna acaba -- daqui sai só o SINAL de que já
             se rolou. */
          data-rolou={bordas.antes ? "" : undefined}
          role="region"
          aria-label={rotulo}
          tabIndex={0}
          /* O anel fica por DENTRO: a região encosta na borda do cartão, e
             um anel por fora seria aparado por ele. */
          _focusVisible={{ outline: "2px solid", outlineColor: "fg.brand", outlineOffset: "-2px" }}
        >
          {children}
        </Box>

        {/* 44px é a medida do quadro -- larga o bastante para se ler como
            "continua" e estreita o bastante para não apagar um número. Mas
            ela é o TETO, não a medida: o esmaecido nunca é mais largo do
            que o que ele esconde. Ver `quantoPassa`. */}
        {bordas.antes && <Esmaecido lado="left" largura={bordas.quantoPassa} />}
        {bordas.depois && <Esmaecido lado="right" largura={bordas.quantoPassa} />}
      </Box>
    </>
  );
}

/** A faixa que dissolve o conteúdo na borda do cartão.
 *
 * 🔴 **Nunca mais larga do que o que esconde.** Visto na tela: o documento
 * da fatura passa nove pixels em 360px, e uma faixa de 44px apagava a maior
 * parte do VALOR -- o número que se está ali para ler -- só para anunciar
 * nove pixels. A faixa agora diz quanto falta, e não só que falta.
 *
 * ⚠️ O gradiente vai para `bg.surface`, o fundo do cartão -- num tema escuro
 * um branco fixo seria uma mancha clara. */
function Esmaecido({ lado, largura }: { lado: "left" | "right"; largura: number }) {
  return (
    <Box
      position="absolute"
      top="0"
      bottom="0"
      left={lado === "left" ? "0" : undefined}
      right={lado === "right" ? "0" : undefined}
      w={`${Math.min(44, largura)}px`}
      pointerEvents="none"
      aria-hidden="true"
      css={{
        backgroundImage: `linear-gradient(to ${lado === "left" ? "left" : "right"}, transparent, var(--chakra-colors-bg-surface))`,
      }}
    />
  );
}
