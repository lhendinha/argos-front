import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { ACOES_DO_CABECALHO } from "../../theme/cabecalho";
import type { CabecalhoDePaginaProps } from "./types";

/** Título e subtítulo de uma tela (`.page-head` do artifact): 23px/800 com
 * a explicação de uma linha embaixo. */
export default function CabecalhoDePagina({ titulo, subtitulo, acoes }: CabecalhoDePaginaProps) {
  return (
    <Flex
      align="flex-start"
      justify="space-between"
      /* 🔴 Quebra quando não couber, e não a partir de uma largura escolhida:
         o que manda é o espaço, não uma régua. O título tem base de 240px e
         pode crescer; as ações mantêm a largura natural. Na tela larga a
         soma cabe e nada muda -- em 1440 o desktop sai pixel a pixel igual
         ao de antes. Em 360, com 328px de conteúdo, 240 + 308 não cabem e as
         ações descem inteiras para a linha de baixo.
         Medido: era este flex, sem `wrap`, que punha `/processos` em 455px e
         `/documentos` em 365. */
      wrap="wrap"
      gap="12px 16px"
      mb="20px"
    >
      <Box flex="1 1 240px" minW="0">
        <Heading
          as="h1"
          fontSize="23px"
          fontWeight="800"
          letterSpacing="-0.01em"
          /* A altura de linha do corpo, e não a do `Heading` do Chakra
             (1.33): são 4px de diferença que empurram tudo que vem
             embaixo -- as abas da tela de Grupo desciam 7px sozinhas. */
          lineHeight="1.45"
        >
          {titulo}
        </Heading>
        {subtitulo && (
          <Text fontSize="13px" color="fg.muted" mt="4px">
            {subtitulo}
          </Text>
        )}
      </Box>
      {/* `.page-head-actions` do artifact: flex com 8px de intervalo. Era um
          `Box` seco, e com DUAS ações elas ficavam coladas -- só apareceu
          quando o Kanban ganhou o "Editar quadro" ao lado do "Nova
          tarefa". */}
      {acoes && (
        /* ⚠️ O grupo também quebra por dentro: o Kanban tem três ações, e em
           360px elas não cabem numa linha nem depois de descerem.

           🔴 E SEM `flexShrink: 0`, que estava aqui e anulava a quebra: com
           ele o grupo nunca estreita abaixo da soma dos botões numa linha,
           então a quebra interna não tinha o que disparar -- o Kanban ficou
           em 381px até isto sair. Ele existia para o título longo não
           espremer os botões; com o pai quebrando, quem não cabe desce em
           vez de ser espremido, que é o mesmo remédio sem o efeito
           colateral.

           ⚠️ E no celular elas ocupam a linha inteira e dividem entre si. A
           regra mora em `ACOES_DO_CABECALHO` porque os cabeçalhos PRÓPRIOS
           das telas de detalhe -- lançamento e processo -- seguem a mesma, e
           três cópias divergiriam no primeiro ajuste. */
        <Box css={ACOES_DO_CABECALHO}>{acoes}</Box>
      )}
    </Flex>
  );
}
