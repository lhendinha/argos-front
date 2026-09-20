import { Flex, Text } from "@chakra-ui/react";

import { EtiquetasDeSubgrupo, ItemDeLista } from "../../../../components";
import { rotuloDoTipo } from "../../../../constants";
import { formatarDataDeInstante, vinculoDoDocumento } from "../../../../utils";
import type { ItemDeDocumentoProps } from "./types";

/** Um documento como ITEM de várias linhas, onde não há largura para as seis
 * colunas.
 *
 * 🔴 **Tipo e subgrupo viram etiquetas na mesma fileira.** Na tabela são
 * duas colunas afastadas por uma terceira; aqui, lado a lado, eles se leem
 * como o que são -- as duas classificações do mesmo documento.
 *
 * ⚠️ **Responsável e data ficam no rodapé, juntos**: as duas respondem
 * "quem e quando", e separá-las gastaria duas linhas para meia informação
 * cada.
 */
export default function ItemDeDocumento({ documento, subgrupoNome, onAbrir }: ItemDeDocumentoProps) {
  const vinculo = vinculoDoDocumento(documento);
  const frase = [vinculo.principal, vinculo.sub].filter(Boolean).join(" · ");
  const responsavel = documento.responsavel_nome || documento.responsavel_id;

  return (
    <ItemDeLista onAbrir={() => onAbrir(documento)} rotulo={documento.titulo}>
      <Text fontSize="14px" fontWeight="700" lineHeight="1.35">
        {documento.titulo}
      </Text>
      {documento.descricao && (
        <Text fontSize="12.5px" color="fg.muted" mt="3px" truncate>
          {documento.descricao}
        </Text>
      )}

      <Flex wrap="wrap" gap="6px" mt="9px" minW="0">
        <Text
          as="span"
          px="9px"
          py="3px"
          borderRadius="full"
          bg="border.subtle"
          color="fg.muted"
          fontSize="12px"
          fontWeight="700"
        >
          {rotuloDoTipo(documento.tipo)}
        </Text>
        <EtiquetasDeSubgrupo nomes={[subgrupoNome(documento.subgrupo_id)]} />
      </Flex>

      {frase && (
        <Text fontSize="12.5px" color="fg.muted" mt="8px" fontFamily={documento.processo_numero ? "mono" : undefined} truncate>
          {frase}
        </Text>
      )}

      <Text fontSize="12px" color="fg.subtle" mt="8px" truncate>
        {[responsavel || "Sem responsável", formatarDataDeInstante(documento.criado_em)].join(" · ")}
      </Text>
    </ItemDeLista>
  );
}
