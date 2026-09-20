import { Box, Flex, Text } from "@chakra-ui/react";

import { LARGURA_DE_CAMPO_CURTO } from "../../constants";
import { Rotulo } from "../Rotulo";
import type { CampoProps } from "./types";

/** Um campo de formulário (`.field` do artifact): rótulo, controle e dica.
 *
 * O rótulo é 12.5px/700 em `ink` -- **não** é o `Rotulo` em caixa-alta, que
 * é outra coisa (rótulo de coluna de filtro). O asterisco de obrigatório vai
 * em `bad`, como no artifact.
 */
export default function Campo({
  rotulo, para, obrigatorio, dica, erro, aposORotulo, curto, children,
}: CampoProps) {
  return (
    <Box mb="16px" position="relative">
      <Flex align="center" mb="6px">
        <Rotulo variante="campo" id={`${para}-rotulo`} htmlFor={para}>
          {rotulo}
          {obrigatorio && (
            <Text as="span" color="status.bad" aria-hidden="true">
              {" *"}
            </Text>
          )}
        </Rotulo>
        {aposORotulo}
      </Flex>
      {/* 🔴 A largura envolve SÓ o controle, e não o campo inteiro: o erro e
          a dica são irmãos aqui embaixo, e 120px os quebrariam em cinco
          linhas de duas palavras.

          ⚠️ O ponto de virada é o MESMO de `LinhaDeCampos` (`sm`), e não um
          número escolhido aqui. Enquanto a linha tem duas colunas, a UF curta
          ao lado do número é o desenho; quando a linha vira uma coluna só, a
          UF fica sozinha numa faixa vazia e o formulário parece desalinhado.
          Dois pontos de virada diferentes dariam uma terceira aparência, no
          intervalo entre eles. */}
      {curto ? <Box maxW={{ base: "100%", sm: LARGURA_DE_CAMPO_CURTO }}>{children}</Box> : children}
      {erro ? (
        <Text fontSize="11.5px" color="status.bad" mt="5px" role="alert">
          {erro}
        </Text>
      ) : (
        dica && (
          <Text fontSize="11.5px" color="fg.subtle" mt="5px">
            {dica}
          </Text>
        )
      )}
    </Box>
  );
}
