import { Box, Flex } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

import type { GavetaProps } from "./types";

export default function Gaveta({ aberta, onFechar, children }: GavetaProps) {
  const painel = useRef<HTMLDivElement>(null);
  /** Quem tinha o foco quando a gaveta abriu -- para devolvê-lo ao fechar. */
  const deOndeVeio = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!aberta) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberta, onFechar]);

  /** 🔴 **O foco entra ao abrir e volta ao fechar.**
   *
   * Sem a ida: quem navega por teclado abre o menu e o foco continua no
   * botão da barra do topo -- o Tab seguinte vai para o sino e o avatar,
   * e só depois de atravessar a barra inteira chega ao menu que acabou de
   * abrir. Com leitor de tela é pior: nada anuncia que algo abriu.
   *
   * Sem a volta: fechar com Escape deixava o foco num link que passou a
   * estar `visibility: hidden`, e o navegador o joga para o `body` -- o Tab
   * seguinte recomeça do topo da página.
   *
   * ⚠️ O painel recebe o foco, e não o primeiro link: um menu de dez itens
   * que abre com o primeiro item aceso parece já ter escolhido por você.
   * `tabIndex={-1}` deixa focá-lo por código sem pô-lo na ordem do Tab.
   *
   * ⚠️ Não há armadilha de foco aqui: a casca já marca o conteúdo com
   * `inert` enquanto a gaveta está aberta, e a barra do topo fica de fora
   * DE PROPÓSITO -- é nela que mora o ✕ que fecha.
   */
  useEffect(() => {
    if (aberta) {
      deOndeVeio.current = document.activeElement as HTMLElement | null;
      painel.current?.focus();
      return;
    }
    /* Só devolve se o foco ainda está dentro da gaveta (ou se ele se perdeu
       para o `body`): clicar num link do menu navega, e roubar o foco de
       volta para o botão desfaria a navegação de quem usa teclado. */
    const atual = document.activeElement;
    const perdido = !atual || atual === document.body;
    if (perdido || painel.current?.contains(atual)) {
      deOndeVeio.current?.focus();
    }
  }, [aberta]);

  return (
    <>
      <Box
        data-fora-da-impressao
        position="fixed"
        inset="0"
        zIndex="30"
        bg="rgba(15,25,35,.45)"
        opacity={aberta ? 1 : 0}
        visibility={aberta ? "visible" : "hidden"}
        transition="opacity .18s ease, visibility .18s ease"
        onClick={onFechar}
        aria-hidden="true"
      />
      <Flex
        ref={painel}
        data-fora-da-impressao
        /* ⚠️ `dialog` com `aria-modal`: é o que faz o leitor de tela anunciar
           "menu, diálogo" ao abrir e confinar a leitura ao painel. Sem isso
           ele continuaria lendo a página inteira por trás da cortina. */
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabIndex={-1}
        direction="column"
        position="fixed"
        top="3px"
        left="0"
        bottom="0"
        zIndex="31"
        w="min(88vw, 320px)"
        bg="bg.surface"
        borderRightWidth="1px"
        borderRightColor="border"
        boxShadow="md"
        transform={aberta ? "translateX(0)" : "translateX(-100%)"}
        visibility={aberta ? "visible" : "hidden"}
        /* 🔴 **Ao ABRIR, a visibilidade não faz transição.** Ela é
           propriedade discreta: com `.18s` no meio, ela vira só depois de
           parte da animação -- e elemento escondido NÃO RECEBE FOCO. O foco
           que este componente manda para o painel simplesmente não pegava, e
           o teste mostrou ele parado no botão da barra. Ao fechar a
           transição fica, senão a gaveta some antes de terminar de deslizar. */
        transition={
          aberta ? "transform .18s ease" : "transform .18s ease, visibility .18s ease"
        }
        /* O painel é alvo de foco por código, e o anel dele não acrescenta
           nada -- a gaveta inteira já apareceu na tela. */
        _focusVisible={{ outline: "none" }}
        /* A gaveta nasce logo abaixo da barra do topo, e não sob ela: o
           botão que a fecha precisa continuar alcançável com ela aberta. */
        pt="60px"
      >
        {children}
      </Flex>
    </>
  );
}
