import { Box, Flex, SimpleGrid, Table, Text } from "@chakra-ui/react";

import {
  CampoDeLeitura,
  Cartao,
  CartaoDeTabela,
  EstadoVazio,
  Tabela,
} from "../../../../components";
import {
  CONTAINER_PARA_EMPILHAR_O_DOCUMENTO,
  NATUREZA_SAIDA,
  TELA_DE_DUAS_COLUNAS,
} from "../../../../constants";
import { contar, formatarCentavos, formatarData } from "../../../../utils";
import { COLUNAS_DO_DOCUMENTO } from "../../../FinanceiroPage/constants";
import type { DocumentoDaFaturaProps } from "./types";

/** O documento em si: o que a fatura cobra, o total, e os dados dela.
 *
 * 🔴 **O total vem do SERVIDOR, e não da soma das linhas.** Ele foi
 * congelado na emissão -- é o número que foi impresso e mandado ao cliente.
 * Recalculá-lo aqui faria o documento mudar sozinho no dia em que alguém
 * editasse um lançamento, e é justamente o que a API impede com 409.
 *
 * ⚠️ **A despesa reembolsada não é linha daqui.** A emissão cria um
 * recebível de reembolso no valor dela, e é ESSE que aparece na tabela; a
 * despesa em si é dinheiro que saiu para o cartório. Somar as duas faria as
 * linhas não fecharem com o total.
 *
 * ⚠️ **Dois cartões irmãos, nunca um dentro do outro.** `CartaoDeTabela` já
 * É cartão (borda, raio e sombra), e envolvê-lo num `Cartao` desenhava
 * moldura dentro de moldura, com os campos de leitura colados na borda de
 * baixo da tabela. Visto na tela.
 *
 * 🔴 **Grade própria, e não `LinhaDeCampos`** -- duas medições, as duas em
 * Chrome:
 *
 * 1. `LinhaDeCampos` tem `rowGap: 0` de propósito, porque quem espaça na
 *    vertical lá é a margem do `Campo`. O `CampoDeLeitura` não tem margem
 *    nenhuma, e nenhuma tela tinha juntado os dois antes -- os pares saíam
 *    colados.
 * 2. As colunas dele vêm do breakpoint `sm` do Chakra, que é `@media
 *    screen`: NO PAPEL a grade desabava para uma coluna só (medido:
 *    `544px 544px` na tela, `1402px` na impressão). Aqui a media query é
 *    CRUA, sem `screen`, e a fatura impressa mantém o par lado a lado.
 *
 * ⚠️ `auto-fit` + `minmax` também não tem media query e foi a primeira
 * tentativa -- mas num cartão de 1100px ele cabe QUATRO colunas, e os
 * quatro campos saíam numa fila só. Medido, não suposto.
 *
 * ➡️ `../../index.test.tsx`.
 */
export default function DocumentoDaFatura({
  fatura,
  nomeDoCliente,
  contaDoRecebimento,
}: DocumentoDaFaturaProps) {
  const somaDasLinhas = fatura.lancamentos.reduce(
    (s, l) => s + l.valor_centavos,
    0,
  );
  /* 🔴 Divergência entre o total congelado e a soma das linhas é sinal de
     que um lançamento sumiu da base, não de arredondamento. Dizer isso é
     melhor que mostrar dois números e deixar quem lê descobrir sozinho. */
  const divergiu = somaDasLinhas !== fatura.valor_total_centavos;

  return (
    <>
      <CartaoDeTabela>
        {/* 🔴 **As três colunas empilham no celular pequeno.** Medido em
            360px (318 de área útil), com descrição longa: a tabela pede
            327px, e 342 quando o valor é R$ 123.456,78 -- e o que ficava
            cortado era o VALOR, numa fatura. Cada saída de coluna foi medida
            nas duas pontas e todas estouram com valor grande; a régua e as
            medidas estão em `CONTAINER_PARA_EMPILHAR_O_DOCUMENTO`.

            🔴 **Consulta de CONTAINER, e é o que preserva o papel.** A
            impressão usa a largura do PAPEL, então lá o container tem 784px
            e a tabela continua tabela -- medido em PDF A4 gerado de uma
            janela de 360px, com e sem a pilha: 0pt de diferença. Media query
            do Chakra não serviria (vira `@media screen`) e
            `useLarguraEstreita` muito menos (troca a árvore por JS, e o
            papel herda a árvore da tela).

            ⚠️ **Os `role` explícitos são cinto de segurança, e eu conferi
            que o Chromium não precisa deles.** A lição corrente é que
            `display: block` apaga o papel implícito da célula; medi a árvore
            de acessibilidade com e sem, empilhada e não, e deu igual nos
            quatro casos: uma tabela, quatro linhas, nove células, três
            cabeçalhos. Ficam porque Firefox e Safari têm histórico de
            apagar, e eu não tenho como medir os dois aqui -- e porque o
            papel declarado é o MESMO que o elemento já tem, então não há o
            que dar errado.

            ⚠️ O cabeçalho some da vista mas NÃO do documento: empilhado ele
            seria três palavras soltas antes de cada linha, e some por
            recorte -- quem lê por voz continua ouvindo "Vencimento".

            ⚠️ O container envolve a tabela E o rodapé do total: os dois
            viram na mesma régua, senão o cartão mudaria de forma pela
            metade. */}
        <Box
          containerType="inline-size"
          css={{
            [`@container ${CONTAINER_PARA_EMPILHAR_O_DOCUMENTO}`]: {
              "& thead": {
                position: "absolute",
                width: "1px",
                height: "1px",
                overflow: "hidden",
                clipPath: "inset(50%)",
              },
              "& tbody tr": {
                display: "block",
                padding: "10px 0",
                borderBottomWidth: "1px",
                borderBottomColor: "border.subtle",
              },
              "& tbody tr:last-child": { borderBottomWidth: 0 },
              /* O recuo vertical some porque quem espaça passa a ser a
                 linha; o horizontal fica, que é a sangria do cartão. */
              "& tbody td": {
                display: "block",
                padding: "0 14px",
                borderBottomWidth: 0,
              },
              /* Data e valor dividem uma linha só, embaixo da descrição. */
              "& tbody td:nth-of-type(2), & tbody td:nth-of-type(3)": {
                display: "inline-block",
                width: "49%",
                paddingTop: "6px",
              },
            },
          }}
        >
          <Tabela
            colunas={COLUNAS_DO_DOCUMENTO}
            vazio={
              fatura.lancamentos.length === 0 ? (
                <EstadoVazio mensagem="Os lançamentos desta fatura não foram encontrados." />
              ) : undefined
            }
          >
            {fatura.lancamentos.map((l) => (
              <Table.Row key={l.lancamento_id} role="row">
                {/* 🔴 **A descrição QUEBRA, e é o que faz a tabela caber.**
                  Medido em 360px: 375px de tabela em 318 visíveis, e o
                  mínimo era igual ao máximo porque a `Table.Cell` do Chakra
                  nasce `nowrap` -- nem a única coluna de texto livre podia
                  quebrar, então as três empurravam juntas. Soltando esta,
                  o mínimo cai para a maior PALAVRA e a tabela passa a caber.
                  As outras duas continuam `nowrap` de propósito: data e
                  valor partidos em duas linhas não se leem.

                  ⚠️ Quebrar, e não truncar como as listas fazem: isto é o
                  documento que vai ao cliente, e esconder o que está sendo
                  cobrado atrás de reticências é o contrário do que ele é. */}
                <Table.Cell
                  role="cell"
                  p="13px 14px"
                  whiteSpace="normal"
                  borderBottomWidth="1px"
                  borderBottomColor="border.subtle"
                >
                  <Text fontSize="13px" fontWeight="700">
                    {l.descricao}
                  </Text>
                  {/* ⚠️ A linha de reembolso se anuncia: ela não é honorário,
                    é a devolução de uma despesa que o escritório adiantou. */}
                  {l.natureza === NATUREZA_SAIDA && (
                    <Text fontSize="12px" color="fg.subtle">
                      Reembolso de despesa
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell
                  role="cell"
                  p="13px 14px"
                  borderBottomWidth="1px"
                  borderBottomColor="border.subtle"
                >
                  <Text fontSize="12.5px" fontFamily="mono" whiteSpace="nowrap">
                    {formatarData(l.data_vencimento)}
                  </Text>
                </Table.Cell>
                <Table.Cell
                  role="cell"
                  p="13px 14px"
                  textAlign="right"
                  borderBottomWidth="1px"
                  borderBottomColor="border.subtle"
                >
                  <Text fontSize="13px" fontFamily="mono" whiteSpace="nowrap">
                    R$ {formatarCentavos(l.valor_centavos)}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Tabela>

          {/* 🔴 **No estreito a contagem desce, e o valor fica onde estava.**
            Visto na tela com R$ 123.456,78 em 360px: com os três na mesma
            linha o `space-between` partia os DOIS lados -- "Total da fatura
            3 / lançamentos" de um lado e "R$ / 123.456,78" do outro. O total
            de uma fatura não quebra no meio do número.

            ⚠️ É a MESMA régua da pilha da tabela, e de propósito: o rodapé é
            a última linha dela, e os dois virando juntos é o que faz o
            cartão parecer uma peça só.

            ⚠️ `nowrap` no valor em qualquer largura: o número é o que a
            pessoa veio ler. Com `wrap` no `Flex`, valor absurdo desce
            inteiro em vez de partir. */}
          <Flex
            justify="space-between"
            align="baseline"
            wrap="wrap"
            gap="4px 12px"
            p="12px 14px"
            borderTopWidth="1px"
            borderTopColor="border"
            css={{
              [`@container ${CONTAINER_PARA_EMPILHAR_O_DOCUMENTO}`]: {
                "& [data-contagem]": {
                  display: "block",
                  marginLeft: 0,
                  marginTop: "2px",
                },
                /* ⚠️ O valor centra na ALTURA das duas linhas, e não na
                   base da primeira: preso à base ele ficava pendurado no
                   topo, 11px acima do centro da etiqueta -- medido. A troca
                   vale só aqui dentro, porque onde a etiqueta tem uma linha
                   só base e centro dão quase o mesmo, e "quase" mexe no
                   desktop. */
                alignItems: "center",
              },
            }}
          >
            <Text fontSize="13px" fontWeight="700">
              Total da fatura
              <Text
                data-contagem
                as="span"
                color="fg.subtle"
                fontWeight="400"
                ml="8px"
              >
                {contar(fatura.lancamentos.length, "lançamento", "lançamentos")}
              </Text>
            </Text>
            <Text
              fontSize="14px"
              fontWeight="800"
              fontFamily="mono"
              whiteSpace="nowrap"
            >
              R$ {formatarCentavos(fatura.valor_total_centavos)}
            </Text>
          </Flex>
        </Box>
      </CartaoDeTabela>

      {divergiu && (
        <Text fontSize="12px" color="status.bad">
          As linhas somam R$ {formatarCentavos(somaDasLinhas)}, e o documento
          foi emitido por R$ {formatarCentavos(fatura.valor_total_centavos)}.
          Vale o valor emitido — algum lançamento desta fatura não foi
          encontrado.
        </Text>
      )}

      <Cartao titulo="Dados da fatura">
        <SimpleGrid
          /* Uma coluna por padrão, duas quando o par cabe -- e a media
             query é CRUA, sem `screen`, para valer no papel também. Ver
             `TELA_DE_DUAS_COLUNAS`. */
          templateColumns="1fr"
          css={{
            [`@media ${TELA_DE_DUAS_COLUNAS}`]: {
              gridTemplateColumns: "1fr 1fr",
            },
          }}
          columnGap="14px"
          rowGap="16px"
        >
          <CampoDeLeitura rotulo="Cliente">
            <Valor>{nomeDoCliente}</Valor>
          </CampoDeLeitura>
          <CampoDeLeitura rotulo="Vencimento">
            <Valor>{formatarData(fatura.data_vencimento)}</Valor>
          </CampoDeLeitura>
          <CampoDeLeitura rotulo="Emitida em">
            <Valor>{formatarData(fatura.criado_em.slice(0, 10))}</Valor>
          </CampoDeLeitura>
          <CampoDeLeitura rotulo="Emitida por">
            <Valor>{fatura.criado_por}</Valor>
          </CampoDeLeitura>
          {/* ⚠️ Só na paga: numa fatura em aberto o par ficaria com travessão
              em duas linhas, dizendo de novo o que a etiqueta do título já
              diz. */}
          {fatura.pago_em && (
            <>
              <CampoDeLeitura rotulo="Paga em">
                <Valor>{formatarData(fatura.pago_em)}</Valor>
              </CampoDeLeitura>
              <CampoDeLeitura rotulo="Conta do recebimento">
                <Valor>{contaDoRecebimento || "Mais de uma conta"}</Valor>
              </CampoDeLeitura>
            </>
          )}
        </SimpleGrid>
      </Cartao>
    </>
  );
}

/** O valor de um campo de leitura, no tamanho que `DetalheHistorico` já usa.
 * Texto solto dentro do `CampoDeLeitura` herda o 14px do corpo e fica maior
 * que o rótulo pede. */
function Valor({ children }: { children: React.ReactNode }) {
  return <Text fontSize="13.5px">{children}</Text>;
}
