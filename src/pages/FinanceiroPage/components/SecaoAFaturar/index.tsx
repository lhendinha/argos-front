import { Box, Table, Text } from "@chakra-ui/react";

import {
  CartaoDeTabela,
  CelulaComSub,
  Esqueleto,
  EstadoDeErro,
  EstadoVazio,
  Pagination,
  Tabela,
} from "../../../../components";
import { LARGURA_MINIMA_DA_TABELA } from "../../../../constants";
import { useLarguraEstreita } from "../../../../hooks/useLarguraEstreita";
import { contar, formatarCentavos, formatarData } from "../../../../utils";
import { COLUNAS_A_FATURAR } from "../../constants";
import ItemAFaturar from "../ItemAFaturar";
import type { SecaoAFaturarProps } from "./types";

/** Os clientes com dinheiro esperando cobrança.
 *
 * 🔴 **Não é uma lista de faturas** -- é o que AINDA NÃO virou uma. Cada
 * linha é um cliente, com o que ele deve somado pelo servidor, e o clique
 * abre a emissão. Fatura sem cliente não existe, então este é o único
 * caminho para criar uma.
 *
 * 🔴 **Honorários e despesas em colunas SEPARADAS**, como no artefato, e
 * não por enfeite: a fatura os trata diferente -- o honorário é linha de
 * cobrança, a despesa vira um recebível de reembolso. Somá-las numa coluna
 * só esconderia de que é feito o total.
 *
 * 🔴 **Paginada, e cada linha só com o resumo**: total, quantidade e o
 * vencimento mais antigo. Os lançamentos vêm ao abrir o cliente, no modal de
 * emissão -- a lista não lê o que não mostra. Com eles dentro, a resposta de
 * um escritório grande passava dos 6 MB da API.
 *
 * ⚠️ **"O mais antigo de" vem do artefato do "Não cobrar"**: diz há quanto
 * tempo o dinheiro espera, o que a quantidade sozinha não diz.
 *
 * ⚠️ **A contagem de cima é a do TOTAL de clientes**, não a da página: "20
 * clientes com honorários a faturar" numa lista de 300 mentiria.
 *
 * ➡️ `../ListaDeFaturas/index.test.tsx`.
 */
export default function SecaoAFaturar({
  clientes, carregando, erro, onTentarDeNovo, paginacao, onEmitir,
}: SecaoAFaturarProps) {
  const [medir, estreita] = useLarguraEstreita(LARGURA_MINIMA_DA_TABELA.aFaturar);
  const vazio =
    clientes.length === 0 ? (
      <EstadoVazio mensagem="Nada a faturar: todo honorário e toda despesa de cliente já foram cobrados." />
    ) : undefined;

  if (carregando) return <Esqueleto linhas={4} />;
  if (erro) {
    return (
      <CartaoDeTabela>
        <EstadoDeErro
          mensagem="Não foi possível carregar o que há a faturar."
          onTentarDeNovo={onTentarDeNovo}
        />
      </CartaoDeTabela>
    );
  }

  return (
    <>
      <Text fontSize="11.5px" color="fg.subtle" mb="10px">
        {paginacao.total > 0
          ? `${contar(paginacao.total, "cliente", "clientes")} com honorários e despesas a faturar · clique no cliente para emitir`
          : ""}
      </Text>

      <CartaoDeTabela>
        <Box ref={medir}>
          {estreita ? (
            vazio || (
              <Box px="6px">
                {clientes.map((c) => (
                  <ItemAFaturar key={c.cliente_id} cliente={c} onEmitir={onEmitir} />
                ))}
              </Box>
            )
          ) : (
        <Tabela
          colunas={COLUNAS_A_FATURAR}
          vazio={vazio}
        >
          {clientes.map((c) => (
            <Table.Row
              key={c.cliente_id}
              tabIndex={0}
              cursor="pointer"
              _hover={{ bg: "bg.canvas" }}
              onClick={() => onEmitir(c)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onEmitir(c);
                }
              }}
            >
              <CelulaComSub
                variante="destaque"
                principal={c.cliente_nome}
                sub={`${contar(c.quantidade, "lançamento", "lançamentos")} · o mais antigo de ${formatarData(c.mais_antigo)}`}
              />
              <Table.Cell p="13px 14px" textAlign="right" borderBottomWidth="1px" borderBottomColor="border.subtle">
                <Text fontSize="13px" fontFamily="mono" whiteSpace="nowrap">
                  R$ {formatarCentavos(c.honorarios_centavos)}
                </Text>
              </Table.Cell>
              <Table.Cell p="13px 14px" textAlign="right" borderBottomWidth="1px" borderBottomColor="border.subtle">
                <Text fontSize="13px" fontFamily="mono" whiteSpace="nowrap">
                  R$ {formatarCentavos(c.despesas_centavos)}
                </Text>
              </Table.Cell>
              <Table.Cell p="13px 14px" textAlign="right" borderBottomWidth="1px" borderBottomColor="border.subtle">
                <Text fontSize="13px" fontWeight="700" fontFamily="mono" whiteSpace="nowrap">
                  R$ {formatarCentavos(c.total_centavos)}
                </Text>
              </Table.Cell>
            </Table.Row>
          ))}
        </Tabela>
          )}
        </Box>
        <Pagination {...paginacao} />
      </CartaoDeTabela>
    </>
  );
}
