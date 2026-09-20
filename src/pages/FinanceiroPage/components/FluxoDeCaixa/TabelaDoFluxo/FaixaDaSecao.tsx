import { Flex, Table, Text } from "@chakra-ui/react";

import { BotaoNu, IconeChevron } from "../../../../../components";
import type { FaixaDaSecaoProps } from "./types";

/** A faixa que nomeia uma seção -- ENTRADAS, SAÍDAS, SALDO.
 *
 * 🔴 **É uma faixa, e não uma linha de números.** No artefato ela atravessa
 * a tabela inteira com o tom da seção (verde, vermelho, azul) e diz só o
 * nome; quem carrega os números é o "Total de entradas" logo abaixo das
 * categorias. Eu tinha juntado as duas coisas numa linha só -- os totais
 * ficavam ANTES das categorias que os compõem, que é a ordem inversa da que
 * se lê.
 *
 * ⚠️ O tom é o do semáforo do projeto, e o texto usa a versão ESCURA dele:
 * a cor cheia sobre o tint não passa em 4,5:1, que é a régua de texto
 * pequeno (ver `theme/contraste.test.ts`).
 *
 * ⚠️ A faixa do SALDO não dobra: ela tem duas linhas e nenhuma categoria --
 * uma seta que esconde o resultado da tabela não serve a ninguém.
 */
export default function FaixaDaSecao({
  rotulo, natureza, quantasColunas, fundo, cor, dobrada, onAlternar,
}: FaixaDaSecaoProps) {
  /* 🔴 **Quem gruda é o NOME, e não a célula.** A célula já era
     `position: sticky; left: 0` -- e não grudava: medido em 390px, ao rolar
     até dezembro ela estava em -1606px, e a faixa de ENTRADAS chegava ao fim
     da rolagem VAZIA, sem dizer de que seção eram as linhas. A razão é que
     `sticky` desloca o elemento dentro do que sobra do bloco que o contém, e
     uma célula com `colSpan` de toda a tabela ocupa a linha inteira: sobra
     zero, então não há para onde deslizar. O nome, dentro dela, tem os
     1975px da célula como folga. */
  const nome = (
    <Flex align="center" gap="8px" position="sticky" left="0" w="fit-content">
      {onAlternar && natureza && (
        <Flex
          as="span"
          color={cor}
          transition="transform .15s"
          transform={dobrada ? "rotate(-90deg)" : undefined}
        >
          <IconeChevron tamanho={13} />
        </Flex>
      )}
      <Text as="span" fontSize="11px" fontWeight="800" letterSpacing="0.6px">
        {rotulo}
      </Text>
    </Flex>
  );

  return (
    <Table.Row bg={fundo}>
      {/* 🔴 Uma célula só, atravessando a tabela: é o que faz a faixa ir de
          ponta a ponta mesmo com a rolagem horizontal. O que gruda na
          esquerda é o conteúdo dela -- ver o comentário do `nome`. */}
      <Table.Cell
        colSpan={quantasColunas}
        p="10px 14px"
        bg={fundo}
        color={cor}
        borderBottomWidth="1px"
        borderBottomColor="border.subtle"
      >
        {onAlternar && natureza ? (
          <BotaoNu
            type="button"
            onClick={() => onAlternar(natureza)}
            aria-expanded={!dobrada}
            color={cor}
            display="flex"
            alignItems="center"
            /* O botão é o pai do `nome`; sem herdar o grude, ele voltaria a
               ser uma caixa de 1975px com o rótulo na ponta esquerda. */
            left="0"
            w="fit-content"
            /* 🔴 44px no apontador grosso: este botão dobra e desdobra a
               seção inteira, e media 20px de altura. Cresce a ÁREA, não o
               desenho -- a faixa é fina de propósito no artefato, e um
               retângulo invisível de -12px em cima e embaixo cobre a linha
               toda sem mexer nela.

               ⚠️ `sticky` JÁ é posicionado, então o pseudo resolve contra
               ele -- não dá para trocar por `relative` sem perder o grude. */
            position="sticky"
            _after={{
              content: '""',
              position: "absolute",
              insetBlock: "-12px",
              insetInline: "0",
              "@media (pointer: fine)": { display: "none" },
            }}
          >
            {nome}
          </BotaoNu>
        ) : (
          nome
        )}
      </Table.Cell>
    </Table.Row>
  );
}
