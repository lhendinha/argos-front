import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import type { CSSProperties } from "react";

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

  return (
    <Flex
      direction="column"
      minH="100dvh"
      p="24px"
      bg="bg.canvas"
      style={
        areaVisivel.altura
          ? ({
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
        p="34px 30px"
        bg="bg.surface"
        borderWidth="1px"
        borderColor="border"
        borderRadius="lg"
        boxShadow="md"
      >
        <Flex justify="center" mb="26px">
          <MarcaArgos tamanho="gate" />
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
