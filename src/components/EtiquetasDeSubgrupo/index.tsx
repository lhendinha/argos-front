import { Box, Flex, Popover, Portal, Text } from "@chakra-ui/react";

import { BotaoNu } from "../BotaoNu";
import Etiqueta from "../Etiqueta";
import { PAINEL_DE_MENU } from "../../theme/menu";
import { CORES_DA_ETIQUETA_DE_SUBGRUPO } from "../../theme/lista";
import { Z_INDEX_MENU_PORTAL } from "../../constants";
import type { EtiquetasDeSubgrupoProps } from "./types";

/** Acima disto a célula mostra a CONTAGEM em vez dos nomes. */
const TETO_DE_NOMES = 2;

/** Os subgrupos de uma linha: até dois mostra os nomes, de três em diante
 * mostra um botão que ABRE a lista.
 *
 * 🔴 **A régua é a de `utils/select.rotuloResumo`**, que o `MultiSelect`
 * aplica ao mesmo dado. Nasceu na linha de inscrição da OAB e a coluna
 * "Subgrupo" de Membros passou a precisar da mesma coisa -- o comentário
 * original já dizia por que não duplicar: *duas maneiras de resumir a mesma
 * lista divergem no primeiro ajuste*.
 *
 * ⚠️ **O motivo do teto é a ALTURA DA LINHA.** Um grupo pode ter 20
 * subgrupos, e vinte etiquetas quebram em quatro fileiras: a linha cresce, as
 * vizinhas não, e as colunas descolam do que descrevem.
 *
 * 🔴 **O resumo agora ABRE, e é por isso que ele é um botão.** O `title`
 * carregava a lista inteira e devolvia ao PONTEIRO -- e no toque não há
 * ponteiro. Medido: no celular a contagem era informação perdida, não
 * resumida, porque o detalhe do envio também não lista subgrupo. O `title`
 * fica para quem tem mouse; o botão é para todo mundo.
 *
 * 🔴 **Um VERBO, e não uma cor.** A primeira tentativa foi pintar a pílula
 * com `bg.brand.subtle` para dizer "esta se toca" -- e esse azul já é o
 * atendimento fechado, o papel super-admin, o prazo do processo E a etiqueta
 * "Enviado", que fica colada nesta no histórico. Duas pílulas idênticas, uma
 * estado e outra controle. Toda etiqueta do sistema é substantivo; "Ver" é o
 * único verbo, e verbo não se confunde com estado -- nem no escuro, nem em
 * preto e branco, nem num leitor de tela.
 *
 * ⚠️ **Branco com borda é a `PilulaDeFiltro` apagada**, que é como esta casa
 * desenha controle. As etiquetas em volta são todas preenchidas; esta é a
 * única vazada.
 *
 * ⚠️ **`stopPropagation` no gatilho**: a linha inteira abre o registro, e sem
 * isto tocar no botão abriria o registro em vez da lista.
 *
 * ⚠️ **O gatilho é um `<button>`, então não pode nascer dentro de outro.**
 * Só resume quem recebe TRÊS ou mais nomes -- Histórico, Membros e as
 * inscrições da OAB --, e nenhum deles aninha. A Agenda e os processos do
 * cliente passam `[um nome]` por construção e nunca chegam aqui; quem mudar
 * isso precisa tirar a etiqueta de dentro do botão antes.
 */
export default function EtiquetasDeSubgrupo({ nomes }: EtiquetasDeSubgrupoProps) {
  /* O travessão, e não a célula vazia: numa coluna com nome, vazio se lê como
     dado que faltou, não como "nada a declarar". */
  if (nomes.length === 0) {
    return (
      <Text as="span" fontSize="12.5px" color="fg.subtle">
        —
      </Text>
    );
  }

  if (nomes.length <= TETO_DE_NOMES) {
    return (
      /* ⚠️ `minW: 0` para a faixa poder estreitar: sem isso ela guarda a
         largura das etiquetas somadas e o teto de 100% delas resolve contra
         um container que nunca encolhe. */
      <Flex gap="6px" wrap="wrap" minW="0" title={nomes.join(", ")}>
        {nomes.map((nome) => (
          <Etiqueta key={nome} cores={CORES_DA_ETIQUETA_DE_SUBGRUPO}>
            {nome}
          </Etiqueta>
        ))}
      </Flex>
    );
  }

  return (
    <Popover.Root
      /* 🔴 **`lazyMount` + `unmountOnExit`, pelo defeito que `DicaDeCampo` já
         pagou.** Sem eles o posicionador continua montado depois de fechar,
         por cima da tela, e ENGOLE cliques -- clicar fora não contava como
         "clique fora", e o balão parecia não fechar nunca. */
      lazyMount
      unmountOnExit
      positioning={{ placement: "bottom-start", gutter: 6 }}
    >
      <Popover.Trigger asChild>
        <BotaoNu
          type="button"
          aria-label={`Ver os ${nomes.length} subgrupos`}
          /* ⚠️ O `title` FICA. Ele é a saída de quem tem ponteiro, e eu o
             tinha removido ao pôr o botão -- contra o que o próprio
             comentário acima diz. Quem pegou foi o teste. */
          title={nomes.join(", ")}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          /* Acima da camada que abre o registro -- ver `ItemDeLista`. */
          position="relative"
          zIndex="1"
          display="inline-block"
          p="3px 9px"
          borderRadius="full"
          borderWidth="1px"
          borderStyle="solid"
          borderColor="border"
          bg="bg.surface"
          color="fg.muted"
          fontSize="11px"
          fontWeight="800"
          textTransform="uppercase"
          letterSpacing="0.02em"
          whiteSpace="nowrap"
          _hover={{ borderColor: "fg.brand", color: "brand.darker" }}
          /* O alvo de 44px cresce em volta, sem inchar a pílula desenhada --
             mesmo recurso dos botões de concluir e de assumir. */
          _after={{ content: '""', position: "absolute", inset: "-11px -8px", borderRadius: "full" }}
        >
          {`Ver ${nomes.length} subgrupos`}
        </BotaoNu>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner zIndex={Z_INDEX_MENU_PORTAL}>
          <Popover.Content css={PAINEL_DE_MENU} width="auto" minW="216px">
            <Box
              px="10px"
              pt="6px"
              pb="7px"
              mb="4px"
              borderBottomWidth="1px"
              borderBottomColor="border.subtle"
              fontSize="10.5px"
              fontWeight="800"
              letterSpacing="0.06em"
              textTransform="uppercase"
              color="fg.subtle"
            >
              Subgrupos
            </Box>
            {nomes.map((nome) => (
              <Box key={nome} px="10px" py="8px" fontSize="13px" color="fg">
                {nome}
              </Box>
            ))}
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
