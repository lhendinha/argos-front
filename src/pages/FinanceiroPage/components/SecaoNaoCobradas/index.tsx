import { Box, Table, Text } from "@chakra-ui/react";

import {
  Botao,
  CartaoDeTabela,
  CelulaComSub,
  Esqueleto,
  EstadoDeErro,
  EstadoVazio,
  Pagination,
  Tabela,
} from "../../../../components";
import { LIMIAR_DA_LISTA_EM_ITENS } from "../../../../constants";
import { useLarguraEstreita } from "../../../../hooks/useLarguraEstreita";
import { formatarCentavos, formatarData } from "../../../../utils";
import { COLUNAS_NAO_COBRADAS } from "../../constants";
import ItemNaoCobrado from "../ItemNaoCobrado";
import type { SecaoNaoCobradasProps } from "./types";

/** As despesas tiradas de "A faturar" por "Não cobrar".
 *
 * 🔴 **O escritório já pagou por elas.** A lista existe para esse dinheiro adiantado não sumir de vista, e para desfazer
 * a decisão ("Voltar a cobrar") sem procurar a despesa entre os lançamentos.
 *
 * ⚠️ **A linha abre o detalhe do lançamento**, como no artefato; o botão da última coluna para o clique antes de ele
 * chegar à linha.
 *
 * ⚠️ "Adiantada em" é a data em que o escritório PAGOU. A despesa marcada antes de ser paga mostra o vencimento.
 *
 * ➡️ `../ListaDeFaturas/index.test.tsx`.
 */
export default function SecaoNaoCobradas({
  itens, carregando, erro, onTentarDeNovo, paginacao, onAbrir, onVoltarACobrar, voltando,
}: SecaoNaoCobradasProps) {
  const [medir, estreita] = useLarguraEstreita(LIMIAR_DA_LISTA_EM_ITENS);
  const vazio =
    itens.length === 0 ? (
      <EstadoVazio mensagem="Nenhuma despesa marcada como não cobrar." />
    ) : undefined;

  if (carregando) return <Esqueleto linhas={4} />;
  if (erro) {
    return (
      <CartaoDeTabela>
        <EstadoDeErro
          mensagem="Não foi possível carregar as despesas não cobradas."
          onTentarDeNovo={onTentarDeNovo}
        />
      </CartaoDeTabela>
    );
  }

  return (
    <>
      <Text fontSize="11.5px" color="fg.subtle" mb="10px">
        Despesas tiradas de "A faturar". O escritório já pagou por elas; só não serão cobradas do cliente até alguém
        voltar a cobrá-las.
      </Text>

      <CartaoDeTabela>
        <Box ref={medir}>
          {estreita ? (
            vazio || (
              <Box px="6px">
                {itens.map((d) => (
                  <ItemNaoCobrado
                    key={d.lancamento_id}
                    despesa={d}
                    voltando={voltando}
                    onAbrir={onAbrir}
                    onVoltarACobrar={onVoltarACobrar}
                  />
                ))}
              </Box>
            )
          ) : (
        <Tabela
          colunas={COLUNAS_NAO_COBRADAS}
          vazio={vazio}
        >
          {itens.map((d) => (
            <Table.Row
              key={d.lancamento_id}
              tabIndex={0}
              cursor="pointer"
              _hover={{ bg: "bg.canvas" }}
              onClick={() => onAbrir(d.lancamento_id)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onAbrir(d.lancamento_id);
                }
              }}
            >
              <CelulaComSub
                variante="destaque"
                principal={d.descricao}
                sub={`${d.cliente_nome} · marcada por ${d.nao_cobrar_por_nome} em ${formatarData(d.nao_cobrar_em)}`}
              />
              <Table.Cell p="13px 14px" borderBottomWidth="1px" borderBottomColor="border.subtle">
                <Text fontSize="12.5px" fontFamily="mono" whiteSpace="nowrap">
                  {formatarData(d.data_efetivacao || d.data_vencimento)}
                </Text>
              </Table.Cell>
              <Table.Cell p="13px 14px" textAlign="right" borderBottomWidth="1px" borderBottomColor="border.subtle">
                <Text fontSize="13px" fontFamily="mono" whiteSpace="nowrap">
                  R$ {formatarCentavos(d.valor_centavos)}
                </Text>
              </Table.Cell>
              <Table.Cell p="13px 14px" textAlign="right" borderBottomWidth="1px" borderBottomColor="border.subtle">
                <Botao
                  variante="ghost"
                  disabled={voltando === d.lancamento_id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onVoltarACobrar(d);
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  Voltar a cobrar
                </Botao>
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
