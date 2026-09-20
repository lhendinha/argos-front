import { Flex, Text } from "@chakra-ui/react";

import { Etiqueta, ItemDeLista } from "../../../../components";
import { CORES_DO_NAO_COBRAR, coresDaSituacao, corDoValor, sinalDoValor } from "../../../../theme/lancamento";
import { formatarCentavos, formatarData } from "../../../../utils";
import { ROTULO_DA_SITUACAO } from "../../constants";
import type { ItemDeLancamentoProps } from "./types";

/** Um lançamento como ITEM de várias linhas, onde não há largura para as
 * seis colunas.
 *
 * 🔴 **O VALOR sobe para a primeira linha, ao lado da descrição.** Na tabela
 * ele é a última coluna, à direita, porque ali o olho desce uma coluna de
 * números comparáveis. Aqui não há coluna: cada item é um bloco, e o valor
 * é a primeira coisa que se pergunta de um lançamento. Ele mantém o `mono` e
 * a cor da natureza, que é o que distingue entrada de saída sem ler o sinal.
 *
 * ⚠️ **Categoria e conta descem para o rodapé, juntas.** Elas classificam,
 * não identificam, e duas linhas separadas gastariam o dobro para dizer o
 * mesmo.
 */
export default function ItemDeLancamento({
  lancamento: l,
  categoriaNome,
  contaNome,
  onAbrir,
}: ItemDeLancamentoProps) {
  const pedaco = l.valor_no_departamento_centavos;
  const mostrarTotal = pedaco !== undefined && pedaco !== l.valor_centavos;
  const apoio = l.contraparte || l.cliente_nome;

  return (
    <ItemDeLista onAbrir={onAbrir} rotulo={l.descricao}>
      <Flex align="flex-start" justify="space-between" gap="12px" minW="0">
        <Text fontSize="14px" fontWeight="700" lineHeight="1.35" minW="0">
          {l.descricao}
        </Text>
        <Flex direction="column" align="flex-end" gap="1px" flex="0 0 auto">
          <Text
            fontSize="14px"
            fontWeight="700"
            fontFamily="mono"
            whiteSpace="nowrap"
            color={corDoValor(l.natureza)}
          >
            {sinalDoValor(l.natureza)} R$ {formatarCentavos(pedaco ?? l.valor_centavos)}
          </Text>
          {mostrarTotal && (
            <Text fontSize="11px" color="fg.muted" whiteSpace="nowrap">
              de R$ {formatarCentavos(l.valor_centavos)}
            </Text>
          )}
        </Flex>
      </Flex>

      {apoio && (
        <Text fontSize="12.5px" color="fg.muted" mt="3px" truncate>
          {apoio}
        </Text>
      )}

      <Flex align="center" wrap="wrap" gap="6px" mt="9px" minW="0">
        <Etiqueta cores={coresDaSituacao(l.situacao)}>
          {ROTULO_DA_SITUACAO[l.situacao] ?? l.situacao}
        </Etiqueta>
        {Boolean(l.nao_cobrar_em) && <Etiqueta cores={CORES_DO_NAO_COBRAR}>Não cobrar</Etiqueta>}
        <Text as="span" fontSize="12.5px" color="fg.muted" whiteSpace="nowrap">
          {formatarData(l.data_vencimento)}
        </Text>
      </Flex>

      <Text fontSize="12px" color="fg.subtle" mt="8px" truncate>
        {[categoriaNome, contaNome].filter(Boolean).join(" · ")}
      </Text>
    </ItemDeLista>
  );
}
