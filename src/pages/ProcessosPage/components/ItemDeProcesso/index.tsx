import { Box, Flex, Text } from "@chakra-ui/react";

import { EtiquetasDeSubgrupo, ItemDeLista } from "../../../../components";
import { formatarData, mascararNumeroProcesso } from "../../../../utils";
import type { ItemDeProcessoProps } from "./types";

/** Um processo como ITEM de várias linhas, onde não há largura para as sete
 * colunas da tabela.
 *
 * 🔴 **Não é a linha com as células empilhadas.** Empilhar daria sete linhas
 * rotuladas ("SUBGRUPO: Cível"), que é o que o dado tem e não o que a
 * pergunta pede. Quem abre a lista no celular quer saber QUAL processo é, de
 * QUEM, e QUANDO vence -- nessa ordem. Por isso o identificador vem primeiro
 * e sozinho, cliente e subgrupo viram etiquetas na mesma fileira, e situação
 * e prazo dividem um rodapé.
 *
 * ⚠️ **Última movimentação e responsável ficam de FORA.** Não por
 * esquecimento: eles não respondem nenhuma das três perguntas acima, e o
 * item precisa caber num relance. Os dois estão na tela do processo, a um
 * toque daqui.
 *
 * ⚠️ O número é sempre mostrado, com ou sem apelido: é ele que identifica o
 * processo fora do sistema, e é por ele que se procura no papel.
 */
export default function ItemDeProcesso({
  processo: p,
  subgrupoNome,
  clientesNomes,
  situacaoRotulo,
  onAbrir,
}: ItemDeProcessoProps) {
  const numero = mascararNumeroProcesso(p.numero_processo);
  const clientes = clientesNomes(p);
  const situacao = situacaoRotulo(p.situacao_id);

  return (
    <ItemDeLista onAbrir={() => onAbrir(p)} rotulo={p.apelido || numero}>
      {p.apelido && (
        <Text fontSize="14px" fontWeight="700" lineHeight="1.35">
          {p.apelido}
        </Text>
      )}
      <Text
        fontFamily="mono"
        fontSize="12.5px"
        fontWeight={p.apelido ? "400" : "700"}
        color={p.apelido ? "fg.muted" : "fg"}
        mt={p.apelido ? "3px" : "0"}
      >
        {numero}
      </Text>

      <Flex wrap="wrap" gap="6px" mt="9px" minW="0">
        {clientes && (
          <Text
            as="span"
            px="9px"
            py="3px"
            borderRadius="full"
            bg="border.subtle"
            color="fg.muted"
            fontSize="12px"
            fontWeight="700"
            maxW="100%"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {clientes}
          </Text>
        )}
        <EtiquetasDeSubgrupo nomes={[subgrupoNome(p.subgrupo_id)]} />
      </Flex>

      {/* O rodapé só existe quando há o que pôr nele: um traço e um vazio
          gastariam uma linha para dizer nada. */}
      {(situacao || p.prazo_final) && (
        <Flex
          align="center"
          justify="space-between"
          gap="10px"
          mt="10px"
          pt="10px"
          borderTopWidth="1px"
          borderTopColor="border.subtle"
        >
          <Text fontSize="12.5px" color="fg.muted" truncate minW="0">
            {situacao || "Sem situação"}
          </Text>
          {p.prazo_final && (
            <Box flex="0 0 auto">
              <Text
                as="span"
                px="9px"
                py="3px"
                borderRadius="full"
                bg="bg.brand.subtle"
                color="brand.darker"
                fontSize="12px"
                fontWeight="800"
              >
                {formatarData(p.prazo_final)}
              </Text>
            </Box>
          )}
        </Flex>
      )}
    </ItemDeLista>
  );
}
