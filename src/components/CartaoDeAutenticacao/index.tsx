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
      /* 🔴 **Um caminho só, e o recuo ancorado em `vh`.** Tudo que reage a
         um número que o teclado mexe faz a tela se mexer junto -- e este
         componente já perdeu duas versões para isso. A primeira prendia a
         coluna ao viewport e perseguia o deslocamento com `translateY`, que
         entra um render atrasado: no quadro do meio a tela inteira aparecia
         fora do lugar. A segunda trocou por um recuo igual à FAIXA visível,
         e a faixa muda quando se vai do e-mail para a senha -- medido num
         iPhone 17 Pro Max: 393 com um teclado, 416 com o outro. Cada troca
         mudava a altura do documento, e a rolagem pulava 35px atrás.

         `vh` é a única medida daqui que o teclado não toca: é o viewport
         GRANDE, imune ao teclado e à barra do navegador. Metade dele sobra
         para qualquer campo subir acima do teclado, e o número não muda
         enquanto a pessoa digita.

         ⚠️ **Não escolhe caminho por plataforma, nem por "o layout
         encolheu".** Eu tentei essa régua e ela varia sozinha: no mesmo
         iPhone, mesma versão, o layout foi de 796 para 696 numa rodada e
         ficou em 796 na seguinte. Quem sabe do teclado é a faixa visível, e
         quem usa a faixa é o `useCampoFocadoAVista` -- que rola pela
         diferença medida, sem depender de layout nenhum.

         ⚠️ Sem teclado não há `style`, e o desktop fica idêntico. */
      /* 🔴 **O cartão continua CENTRADO -- só que na faixa visível, e não
         no layout.** O recuo de baixo é a altura do teclado (`100dvh` é o
         layout, `altura` é a faixa, a diferença é o teclado), então a área
         onde a margem automática centraliza passa a ser exatamente o que se
         enxerga.

         Medido no iPhone do usuário, com toque real, até chegar aqui:

         - Centrado no LAYOUT (696) com faixa de 391, metade do cartão caía
           atrás do teclado e o Safari deslocava a tela a cada toque: cartão
           de 69 para -11.
         - Ancorado no TOPO, o deslocamento por toque diminuiu, mas ABRIR o
           teclado virou um salto de 148px -- porque a ancoragem mudava de
           centro para topo, que são dois lugares diferentes.

         Centrando na faixa, a ancoragem é a MESMA nos dois estados: o
         cartão só acompanha a área que sobrou, sem trocar de regra.

         ⚠️ Sem teclado não há `style`, e o desktop fica idêntico. */
      style={
        areaVisivel.altura
          ? ({
              /* 🔴 **`minHeight` também sai do `dvh`, e o `dvh` mente.**
                 Medido no iPhone do usuário, ao reabrir o teclado: o layout
                 vem 642 e o `100dvh` computado continua **796** -- nas duas
                 aberturas. O documento nasce 796 numa tela de 642, sobram
                 154px, e o Safari rola essa diferença: `y` batia exatamente
                 154 e o cartão ia de 54 para -23.

                 Com a altura viva no lugar do `dvh`, o documento passa a
                 ter o tamanho da tela e não há o que rolar. */
              minHeight: `${areaVisivel.alturaDeLayout}px`,
              paddingBottom: `${Math.max(0, areaVisivel.alturaDeLayout - areaVisivel.altura)}px`,
            } as CSSProperties)
          : undefined
      }
    >
      <Box
        /* 🔴 **Topo com o teclado aberto, centro sem ele.** Centralizar numa
           faixa que MUDA de tamanho faz o cartão andar: os dois teclados do
           iOS têm alturas diferentes (medido: 393 e 416), e meia diferença
           vira deslocamento a cada troca de campo -- 12px, cobrados pela
           guarda. Ancorado no topo, mudar a faixa não move nada.

           ⚠️ `0 auto auto` mantém a margem de baixo automática: cartão mais
           alto que a faixa (o de redefinir senha) começa do topo em vez de
           ser cortado dos dois lados. */
        m={areaVisivel.altura ? "0 auto auto" : "auto"}
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
