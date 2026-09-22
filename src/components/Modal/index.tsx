import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { TELA_APERTADA_PARA_DIALOGO } from "../../constants";
import { useAreaVisivel } from "../../hooks/useAreaVisivel";
import { useCampoFocadoAVista } from "../../hooks/useCampoFocadoAVista";

import { BotaoNu } from "../BotaoNu";
/* ⚠️ Direto, e NUNCA pelo barril `../index`: `ModalDeConfirmacao` importa
   este arquivo de volta, e o ciclo passando pelo barril é a armadilha que
   `ModalDeTarefa` e `ModalDeDocumento` já comentam. Entre os dois arquivos o
   ciclo é inócuo -- os dois são `export default function`, içados, e a
   referência só acontece em tempo de render. */
import ModalDeConfirmacao from "../ModalDeConfirmacao";
import { ProvedorDeDescarte } from "../../contexts/DescarteContext";
import type { ModalProps } from "./types";

/** Modal do sistema (`.overlay` + `.modal` do artifact).
 *
 * A cortina rola (`overflow-y: auto` com `align-items: flex-start`): modal
 * mais alto que a janela precisa rolar por fora, senão o rodapé com os
 * botões fica inalcançável em tela baixa.
 *
 * ## Modal novo: a régua de revisão
 *
 * **Tem campo que a pessoa preenche? Então `descarte={{ mudou }}`**, com o
 * `mudou` vindo de `useGuardaDeDescarte`. `"semFormulario"` é só para modal de
 * LEITURA, de confirmação, de aviso e para os auxiliares que não têm campo
 * nenhum (carregando, "não há subgrupos"). O compilador obriga a declarar;
 * ele não sabe qual das duas é a certa.
 *
 * ⚠️ **O "Cancelar" do rodapé é `BotaoDeCancelar`, nunca um `Botao` com
 * `onFechar`.** Os três gestos que este componente desenha -- Escape, cortina
 * e X -- já passam pela guarda; o rodapé é um `ReactNode` do chamador, e o
 * único jeito de cobri-lo é ele mesmo se ligar ao contexto. Um `Botao` cru ali
 * fecha direto e leva o que foi digitado.
 *
 * ⚠️ **A projeção é o valor que o ENVIO manda**, não o texto do campo nem o
 * derivado que a tela mostra. Máscara, `trim` e `?? ""` entram na projeção --
 * a razão de cada um está no docstring de `useGuardaDeDescarte`.
 *
 * ⚠️ **Salvou e o modal fica aberto?** Chame `refazerRetrato()`: o que está na
 * tela passou a ser o salvo, e perguntar sobre ele seria mentira.
 *
 * 🔴 **E o modal NUNCA mora dentro de um ramo condicional.** Se cada `if` da
 * tela devolve a própria árvore com o modal dentro, uma troca de ramo com ele
 * aberto o REMONTA -- ele continua na tela e volta VAZIO, com o arquivo
 * escolhido e o texto digitado perdidos. Pior que sumir: a pessoa vê a mesma
 * janela e não percebe. E a guarda não alcança, porque ninguém fechou nada.
 * O modal vai num `return` único, como irmão fixo do conteúdo -- ver
 * `DocumentosVinculados`, onde isso foi medido e consertado.
 */
/** Pilha dos modais abertos. O último a montar é o de cima.
 *
 * 🔴 Sem ela, cada Modal registrava o próprio listener no `document` e TODOS
 * respondiam ao Escape. Abrir uma tarefa, clicar em "Excluir" (que monta o
 * ModalDeConfirmacao como irmão) e apertar Esc fechava os dois: quem só quis
 * desistir da exclusão perdia o formulário inteiro e as edições não salvas.
 */
const pilhaDeModais: symbol[] = [];

/** As frases do diálogo de descarte, por caso.
 *
 * 🔴 Três textos, porque um só mentiria. "Alterações" não existe num modal de
 * criação; e nos que salvam na hora nada se perde além do texto digitado --
 * por isso aqueles passam `textoProprio`. */
const PERGUNTA_DE_DESCARTE = {
  edicao: {
    titulo: "Sair sem salvar?",
    mensagem: "As alterações que você fez serão perdidas.",
    sair: "Sair sem salvar",
    voltar: "Continuar editando",
  },
  criacao: {
    titulo: "Sair sem salvar?",
    mensagem: "Este cadastro ainda não foi salvo e será perdido.",
    sair: "Sair sem salvar",
    voltar: "Continuar preenchendo",
  },
} as const;

export default function Modal({ titulo, subtitulo, onFechar, descarte, largo, rodape, acaoNoCabecalho, children }: ModalProps) {
  const [perguntando, setPerguntando] = useState(false);
  /* O teclado só interessa enquanto ESTE diálogo está aberto e não há uma
     pergunta de descarte por cima dele. */
  const areaVisivel = useAreaVisivel(!perguntando);

  /* O campo focado sobe com o teclado -- ver `useCampoFocadoAVista`. O
     escopo é o diálogo: com dois modais abertos, o de baixo não mexe no foco
     do de cima. */
  useCampoFocadoAVista(areaVisivel.altura, '[role="dialog"]');

  /** O que TODO gesto de fechar chama -- Escape, cortina e X.
   *
   * ⚠️ Não é o `onFechar`: este pergunta antes, quando há o que perder. Quem
   * fecha de verdade é o `onFechar`, e ele continua sendo chamado direto pelo
   * formulário depois de salvar -- por isso salvar nunca dispara a pergunta. */
  function pedirParaFechar() {
    if (descarte !== "semFormulario" && descarte.mudou) {
      setPerguntando(true);
      return;
    }
    onFechar();
  }
  // Esc fecha -- é o que se espera de qualquer diálogo, e sem isso quem
  // navega por teclado fica preso dentro dele. Mas só o de CIMA fecha.
  /* 🔴 O efeito roda UMA vez, e o `onFechar` atual vem de um ref.
   *
   * Com `[onFechar]` nas dependências, um `onFechar` com identidade nova a
   * cada render fazia o modal ABERTO sair e voltar pro TOPO da pilha --
   * invertendo a ordem. Um diálogo de confirmação por cima passaria a
   * perder o Escape pro formulário de baixo, que é exatamente o que a pilha
   * existe pra impedir.
   *
   * ⚠️ Os chamadores passam `onFechar` de arrow INLINE -- por exemplo
   * `SubgruposPage` faz `onFechar={() => setVendoMembrosDe(null)}` num
   * wrapper que repassa pro Modal. Se essa identidade muda a cada render
   * depende de o React Compiler memoizar a arrow, e essa garantia NÃO foi
   * verificada. Depender de uma otimização de compilador pra manter uma invariante de
   * ordenação é frágil de qualquer forma. Com deps vazias, a posição na
   * pilha passa a depender só de montagem e desmontagem -- que é o que ela
   * representa -- e a pergunta sobre o Compiler deixa de importar. */
  /* 🔴 O ref guarda a função GUARDADA, não o `onFechar` cru.
   *
   * E o `descarte` NÃO pode entrar nas dependências do listener, por dois
   * motivos que se somam. O primeiro é o já escrito acima: deps que mudam a
   * cada render devolvem o modal ao topo da pilha e invertem a ordem. O
   * segundo é pior e específico daqui: com deps `[]`, uma função capturada na
   * MONTAGEM enxergaria `mudou` congelado -- e na montagem ele é `false` por
   * construção, porque o retrato acabou de ser tirado. O Escape descartaria
   * SEMPRE, não de vez em quando.
   *
   * Com a função reescrita no ref a cada renderização, o listener sempre
   * chama a versão que enxerga o `mudou` de agora. */
  const pedirRef = useRef(pedirParaFechar);
  /* ⚠️ A escrita no ref vai num EFEITO, não no corpo do componente.
   *
   * Escrever `pedirRef.current` durante a renderização é o antipadrão
   * que o React Compiler proíbe ("Cannot access refs during render") -- ele
   * pode descartar e refazer uma renderização, e efeito colateral ali não é
   * garantido. Este efeito não tem deps de propósito: roda depois de toda
   * renderização, que é exatamente quando o callback pode ter mudado. */
  useEffect(() => {
    pedirRef.current = pedirParaFechar;
  });

  useEffect(() => {
    const meuLugar = Symbol("modal");
    pilhaDeModais.push(meuLugar);
    /* 🔴 A página de trás para de rolar enquanto há diálogo na tela. Sem
       isso o dedo que chega ao fim do formulário segue rolando a LISTA
       atrás dele -- o conteúdo se move debaixo do modal e, ao fechar, a
       pessoa está num lugar que não escolheu. No desktop era a segunda
       barra de rolagem à direita, ao lado da do corpo do modal.
       ⚠️ Pela PILHA e não por modal: o diálogo de descarte monta por cima
       deste, e restaurar ao desmontar o de cima destravaria a rolagem com o
       de baixo ainda aberto. */
    const rolagemDeAntes = document.body.style.overflow;
    const recuoDeAntes = document.body.style.paddingRight;
    if (pilhaDeModais.length === 1) {
      /* 🔴 COMPENSA a barra de rolagem que some junto. Sem isso o conteúdo
         de trás alarga uns 15px no instante em que o modal abre e volta ao
         fechar -- medido no desktop: 3.907 pixels diferentes numa tela de
         Processos que não deveria ter mudado nenhum. O salto acontece atrás
         de uma cortina escura, o que o torna fácil de não notar e
         desagradável quando se nota. */
      const somem = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (somem > 0) document.body.style.paddingRight = `${somem}px`;
    }

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key !== "Escape") return;
      if (pilhaDeModais[pilhaDeModais.length - 1] !== meuLugar) return;
      pedirRef.current();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      const onde = pilhaDeModais.indexOf(meuLugar);
      if (onde >= 0) pilhaDeModais.splice(onde, 1);
      if (pilhaDeModais.length === 0) {
        document.body.style.overflow = rolagemDeAntes;
        document.body.style.paddingRight = recuoDeAntes;
      }
    };
  }, []);

  const pergunta =
    descarte !== "semFormulario"
      ? descarte.textoProprio ?? PERGUNTA_DE_DESCARTE[descarte.caso ?? "edicao"]
      : null;

  return (
    /* O provedor envolve a cortina INTEIRA, rodapé incluído: é a posição na
       árvore que faz o `BotaoDeCancelar` do chamador alcançar a função
       guardada, sem o chamador precisar ligar nada. */
    <ProvedorDeDescarte pedirParaFechar={pedirParaFechar}>
    <Flex
      position="fixed"
      inset="0"
      zIndex="100"
      bg="rgba(15,25,35,.45)"
      align="flex-start"
      justify="center"
      p="5vh 20px"
      overflowY="auto"
      onClick={pedirParaFechar}
      /* 🔴 Na tela apertada a cortina para de rolar e para de recuar: quem
         rola passa a ser o CORPO da folha, entre um cabeçalho e um rodapé
         que ficam parados. Enquanto a rolagem era daqui, o rodapé descia
         junto com o conteúdo e saía da tela -- medido no iPhone SE, 106px
         abaixo da dobra, e no mesmo aparelho deitado o rodapé inteiro. */
      css={{ [`@media ${TELA_APERTADA_PARA_DIALOGO}`]: { padding: 0, overflowY: "hidden" } }}
      /* 🔴 `inert` enquanto o diálogo está por cima, e resolve DOIS problemas
         de uma vez: o Tab deixa de passear pelo formulário de trás (não há
         armadilha de foco em lugar nenhum), e o X daqui some da árvore de
         acessibilidade -- senão haveria dois botões chamados "Fechar" no
         mesmo documento -- a regra está no `NARRATIVA.md`. */
      {...(perguntando ? { inert: "" } : {})}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        w="100%"
        maxW={largo ? "760px" : "560px"}
        m="auto"
        bg="bg.surface"
        borderRadius="lg"
        boxShadow="md"
        onClick={(e) => e.stopPropagation()}
        /* A altura vem do `visualViewport` por JS porque nem `100dvh` nem
           `env()` a conhecem: com o teclado aberto, a viewport de LAYOUT não
           encolhe em nenhum dos dois sistemas. A variável existe sempre e é
           lida SÓ dentro da media query -- assim a janela centralizada do
           desktop não muda de altura. */
        style={{ "--altura-da-folha": areaVisivel.altura ? `${areaVisivel.altura}px` : "100dvh",
                 "--desvio-da-folha": `${areaVisivel.deslocamento}px` } as CSSProperties}
        css={{
          [`@media ${TELA_APERTADA_PARA_DIALOGO}`]: {
            maxWidth: "none",
            margin: 0,
            borderRadius: 0,
            display: "flex",
            flexDirection: "column",
            height: "var(--altura-da-folha)",
            transform: "translateY(var(--desvio-da-folha))",
          },
        }}
      >
        <Flex
          align="center"
          justify="space-between"
          p="18px 22px"
          borderBottomWidth="1px"
          borderBottomColor="border.subtle"
          flex="0 0 auto"
          /* Encolhe com o teclado aberto: com 213px úteis, 18px em cima e
             embaixo são 36 dos 213 gastos em respiro. */
          css={{ [`@media ${TELA_APERTADA_PARA_DIALOGO}`]: { padding: "12px 16px" } }}
        >
          <Box>
            <Heading as="h2" fontSize="16.5px" fontWeight="800">
              {titulo}
            </Heading>
            {subtitulo && (
              <Text fontSize="12px" color="fg.subtle" mt="2px">
                {subtitulo}
              </Text>
            )}
          </Box>
          {/* Ação e X num grupo só, à direita: o `Flex` de fora é
              `space-between` e precisa continuar com DOIS filhos -- título
              de um lado, ações do outro. Um terceiro filho direto jogaria a
              ação pro meio do cabeçalho. */}
          <Flex align="center" gap="8px" flexShrink={0}>
            {acaoNoCabecalho}
            {/* ⚠️ O X é sempre o ÚLTIMO. É o alvo que as pessoas procuram no
                canto, e inverter a ordem faria alguém fechar o modal
                querendo clicar na ação. */}
            <BotaoNu
              type="button"
              title="Fechar"
              aria-label="Fechar"
              onClick={pedirParaFechar}
              display="flex"
              alignItems="center"
              justifyContent="center"
              w="34px"
              h="34px"
              borderRadius="full"
              color="fg.muted"
              _hover={{ bg: "border.subtle", color: "fg" }}
            >
              ✕
            </BotaoNu>
          </Flex>

        </Flex>
        <Box
          p="20px 22px"
          maxH="70vh"
          overflowY="auto"
          /* 🔴 `maxH: 70vh` SAI na folha: ali quem manda é o espaço que
             sobra entre cabeçalho e rodapé, e um teto em `vh` o cortaria
             antes disso -- `vh` ignora o teclado. */
          css={{
            [`@media ${TELA_APERTADA_PARA_DIALOGO}`]: {
              maxHeight: "none",
              flex: "1 1 auto",
              minHeight: 0,
              padding: "16px",
            },
          }}
        >
          {children}
        </Box>
        {rodape && (
          <Box
            flex="0 0 auto"
            /* ⚠️ `bg` pela prop, e não por `var(--chakra-colors-...)` num
               `css`: o nome da variável gerada é detalhe do Chakra, e
               escrevê-lo à mão é uma cópia que quebra calada. Aqui ele
               repinta o mesmo fundo do diálogo -- no desktop não muda nada,
               e na folha impede o conteúdo de aparecer por baixo do rodapé
               ao rolar. */
            bg="bg.surface"
            /* O rodapé encosta na borda de baixo da folha: `env()` vale zero
               onde não há recorte. */
            css={{
              [`@media ${TELA_APERTADA_PARA_DIALOGO}`]: {
                paddingBottom: "env(safe-area-inset-bottom)",
              },
            }}
          >
            {rodape}
          </Box>
        )}
      </Box>

    </Flex>

    {/* 🔴 IRMÃO da cortina, e não filho. Dentro dela, um clique no fundo do
        diálogo borbulharia até o `onClick` da cortina de fora -- o
        `stopPropagation` só existe na caixa branca. É a mesma razão que o
        `ModalDoQuadro` já documenta para o diálogo de exclusão dele.

        ⚠️ A pilha de Escape funciona porque este monta num commit POSTERIOR:
        entra por último, fica no topo, e o Escape aqui fecha só a pergunta. */}
    {perguntando && pergunta && (
      <ModalDeConfirmacao
        titulo={pergunta.titulo}
        mensagem={pergunta.mensagem}
        rotulo={pergunta.sair}
        rotuloDeCancelar={pergunta.voltar}

        onConfirmar={() => {
          setPerguntando(false);
          onFechar();
        }}
        onFechar={() => setPerguntando(false)}
      />
    )}
    </ProvedorDeDescarte>
  );
}
