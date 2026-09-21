import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import type { CSSProperties } from "react";

import { FAIXA_QUE_COMPORTA_O_CARTAO_INTEIRO } from "../../constants";
import { useAreaVisivel } from "../../hooks/useAreaVisivel";
import { useCampoFocadoAVista } from "../../hooks/useCampoFocadoAVista";
import MarcaArgos from "../MarcaArgos";
import type { CartaoDeAutenticacaoProps } from "./types";

/** A moldura das telas de entrada (`.gate-page` + `.gate-card` do artifact):
 * cartão de 380px centrado na tela, com a marca em cima.
 *
 * Um componente só para as quatro (entrar, recuperar, redefinir, aceitar
 * convite) porque elas SÃO a mesma tela com miolos diferentes -- quatro
 * cópias desta moldura divergiriam no primeiro ajuste, e ela é a primeira
 * coisa que qualquer pessoa vê do sistema.
 *
 * 🔴 **Era a última tela do sistema onde o teclado escondia o campo.** Medido
 * em 390x800 com teclado de 340px (460px à mostra): o campo de senha do
 * `/login` terminava em 497px e FICAVA lá. A causa não é o centro -- é que a
 * página tinha exatamente uma altura de janela e portanto não rolava: não
 * havia para onde levar o campo. As quatro telas daqui são as únicas com
 * campo fora de modal, e o `Modal` já resolvia o dele.
 *
 * 🔴 **Com o teclado aberto, a moldura passa a SER a faixa visível.** Presa
 * ao topo da viewport visual, com aquela altura e rolagem própria -- o mesmo
 * que o `Modal` faz com a folha dele, e pela mesma razão que o
 * `useAreaVisivel` documenta: a viewport de LAYOUT não encolhe com o teclado,
 * então nem `dvh` nem `env()` sabem desta altura. Fora do teclado o `style`
 * nem existe, e o desktop fica idêntico.
 *
 * ⚠️ **`100dvh`, e não `100vh`** -- era o último `100vh` do código. O
 * `AppShell` já registra a medida: no iPhone SE o `vh` conta a tela com a
 * barra do Safari recolhida, que ainda não recolheu.
 *
 * ⚠️ **Centrado por `m="auto"`, e não por `justify="center"`**, como a folha
 * do `Modal`. Quando o cartão é mais alto que a faixa (o de redefinir senha
 * mede 473px), centralizar o corta dos DOIS lados e o topo fica inalcançável
 * -- margem automática cede a zero e devolve o começo do cartão.
 */
export default function CartaoDeAutenticacao({ titulo, subtitulo, children }: CartaoDeAutenticacaoProps) {
  /* ⚠️ `comPiso: false` -- esta tela não prende rodapé nenhum, e o piso de
     180px, que existe para isso, desligava a correção num Android comum:
     medido em Chrome real, o teclado deixa 172px de área visível e o campo
     de senha ficava atrás dele. Ver `useAreaVisivel`. */
  const areaVisivel = useAreaVisivel(true, false);
  useCampoFocadoAVista(areaVisivel.altura);

  /* 🔴 **Comprime em vez de esconder.** O cartão tem 448px e o teclado
     deixa 393 num iPhone 17 Pro Max -- não cabe, e o Safari rola a cada
     troca de campo: a marca sai da tela e volta, o que se lê como a tela
     "pulando". Cabendo, ele não rola, e o pulo acaba por não haver o que
     rolar.

     ⚠️ A marca NÃO some: ela troca para a forma deitada, que já existe (é a
     da barra do topo). Empilhada são ~80px de altura; deitada, ~26. Com as
     margens e o recuo menores, o cartão cai para ~350 e sobra folga.

     ⚠️ Num iPhone SE isto não basta, e não há o que fazer: a faixa lá é
     274px, e dois campos mais botão e cabeçalho não cabem nisso. Lá o
     Safari continua rolando -- é espaço que não existe. */
  const apertado =
    areaVisivel.altura !== null && areaVisivel.altura < FAIXA_QUE_COMPORTA_O_CARTAO_INTEIRO;

  return (
    <Flex
      direction="column"
      minH="100dvh"
      p="24px"
      bg="bg.canvas"
      /* 🔴 **Dois caminhos, escolhidos pela MEDIDA -- não pelo aparelho.**
         Quem decide é `layoutEncolheu`: o viewport de layout encolheu junto
         com o teclado?

         **Encolheu (iOS)**: só um recuo embaixo. O navegador já enxerga o
         teclado e rola o campo em foco sozinho; prender a coluna ao viewport
         aqui é o que causava o salto. Medido num iPhone 17 Pro Max: com a
         moldura fixa, cada `focusin` deslocava mais o viewport (45, 173,
         209, 336, 372, 403) e o topo da moldura ia a -128 e voltava a 0 em
         100ms, porque o `translateY` que a compensava só entra no render
         SEGUINTE. Era esse quadro que se via como "a tela deslizou".

         **Não encolheu (Android)**: a moldura fixa continua, e é a única
         coisa que sabe onde o teclado está. Medido: com faixa de 172px num
         layout de 640, sem a moldura o campo de senha termina em 345 --
         atrás do teclado -- porque `scrollIntoView` alinha pelo LAYOUT, que
         ali não mudou. Com a moldura, termina em 172, exatamente na borda.

         ⚠️ Eu tentei um caminho só e a medição derrubou: recuo para todos
         conserta o iPhone e esconde o campo no Android. Dois caminhos não é
         indecisão -- é que as duas plataformas informam coisas diferentes
         sobre o mesmo teclado.

         ⚠️ O recuo é a FAIXA inteira, e não `100dvh - altura`: no iOS o
         `100dvh` já vem encolhido, então a diferença sai curta. Medido num
         iPhone SE, com a diferença a rolagem batia no fim com o campo 4px
         abaixo da faixa.

         ⚠️ Sem teclado não há `style` nenhum, e o desktop fica idêntico --
         0 pixel de diferença nas quatro telas de portão. */
      style={
        areaVisivel.altura
          ? areaVisivel.layoutEncolheu
            ? ({ paddingBottom: `${areaVisivel.altura}px` } as CSSProperties)
            : ({
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                height: `${areaVisivel.altura}px`,
                minHeight: 0,
                overflowY: "auto",
                transform: `translateY(${areaVisivel.deslocamento}px)`,
              } as CSSProperties)
          : undefined
      }
    >
      <Box
        m="auto"
        w="100%"
        maxW="380px"
        p={apertado ? "20px 30px" : "34px 30px"}
        bg="bg.surface"
        borderWidth="1px"
        borderColor="border"
        borderRadius="lg"
        boxShadow="md"
      >
        <Flex justify="center" mb={apertado ? "12px" : "26px"}>
          <MarcaArgos tamanho={apertado ? "barra" : "gate"} />
        </Flex>

        <Heading as="h1" fontSize="18px" fontWeight="800" textAlign="center" mb="6px">
          {titulo}
        </Heading>
        {subtitulo && (
          <Text fontSize="13px" color="fg.muted" textAlign="center" lineHeight="1.5" mb="20px">
            {subtitulo}
          </Text>
        )}

        {children}
      </Box>
    </Flex>
  );
}
