import { Table, Text } from "@chakra-ui/react";

import { Etiqueta } from "../../../../components";
import { coresDaFatura } from "../../../../theme/fatura";
import {
  ROTULO_DA_FATURA,
  formatarCentavos,
  formatarData,
  situacaoDaFaturaNaTela,
} from "../../../../utils";
import type { LinhaDeFaturaProps } from "./types";

/** A fatura emitida como linha de tabela, nas seis colunas.
 *
 * ⚠️ Saiu de dentro de `SecaoEmitidas`, onde era um `map` de sessenta linhas
 * no meio da seção. A separação não é arrumação: é o que permite a seção
 * escolher entre duas árvores -- linha aqui, `ItemDeFatura` abaixo do
 * limiar -- sem carregar as duas no mesmo arquivo.
 */
export default function LinhaDeFatura({ fatura: f, nomeDoCliente, onAbrir }: LinhaDeFaturaProps) {
  const situacao = situacaoDaFaturaNaTela(f);

  return (
    <Table.Row
      tabIndex={0}
      cursor="pointer"
      _hover={{ bg: "bg.canvas" }}
      onClick={() => onAbrir(f.fatura_id)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAbrir(f.fatura_id);
        }
      }}
    >
      <Table.Cell p="13px 14px" borderBottomWidth="1px" borderBottomColor="border.subtle">
        <Text fontSize="12.5px" fontFamily="mono" whiteSpace="nowrap">
          {f.numero}
        </Text>
      </Table.Cell>
      <Table.Cell p="13px 14px" borderBottomWidth="1px" borderBottomColor="border.subtle">
        <Text fontSize="13px" fontWeight="700" truncate>
          {nomeDoCliente(f.cliente_id)}
        </Text>
      </Table.Cell>
      <Table.Cell p="13px 14px" borderBottomWidth="1px" borderBottomColor="border.subtle">
        <Text fontSize="13px" whiteSpace="nowrap">
          {formatarData(f.data_vencimento)}
        </Text>
      </Table.Cell>
      <Table.Cell p="13px 14px" borderBottomWidth="1px" borderBottomColor="border.subtle">
        {/* ⚠️ Travessão, não vazio: vazio lê-se como "não carregou". */}
        <Text fontSize="13px" whiteSpace="nowrap" color={f.pago_em ? undefined : "fg.subtle"}>
          {f.pago_em ? formatarData(f.pago_em) : "—"}
        </Text>
      </Table.Cell>
      <Table.Cell
        p="13px 14px"
        textAlign="right"
        borderBottomWidth="1px"
        borderBottomColor="border.subtle"
      >
        <Text fontSize="13px" fontWeight="700" fontFamily="mono" whiteSpace="nowrap">
          R$ {formatarCentavos(f.valor_total_centavos)}
        </Text>
      </Table.Cell>
      <Table.Cell p="13px 14px" borderBottomWidth="1px" borderBottomColor="border.subtle">
        <Etiqueta cores={coresDaFatura(situacao)}>
          {ROTULO_DA_FATURA[situacao] ?? situacao}
        </Etiqueta>
      </Table.Cell>
    </Table.Row>
  );
}
