import { Box, Text } from "@chakra-ui/react";

import {
  CartaoDeTabela,
  Esqueleto,
  EstadoDeErro,
  EstadoVazio,
  Pagination,
  Tabela,
} from "../../../../components";
import { LARGURA_MINIMA_DA_TABELA } from "../../../../constants";
import { useLarguraEstreita } from "../../../../hooks/useLarguraEstreita";
import { contar } from "../../../../utils";
import { COLUNAS_DE_FATURAS } from "../../constants";
import ItemDeFatura from "../ItemDeFatura";
import LinhaDeFatura from "../LinhaDeFatura";
import type { SecaoEmitidasProps } from "./types";

/** As faturas já emitidas.
 *
 * 🔴 **"Atrasada" é derivada AQUI**, e não vem do servidor: a fatura tem
 * três situações gravadas, e atraso é a data lida contra hoje. Mantê-lo em
 * dia no banco exigiria reescrever toda fatura aberta todas as noites -- a
 * mesma decisão que o lançamento já tomou. Quem deriva é
 * `situacaoDaFaturaNaTela`, uma função só.
 *
 * ⚠️ **A coluna "Pagamento" mostra travessão na não-paga.** Célula vazia
 * lê-se como "não carregou"; o travessão diz "não aconteceu".
 *
 * ⚠️ **Paginada no servidor**, ao contrário de "A faturar": a fatura paga e
 * a cancelada não somem da lista, então ela só cresce. A contagem é a do
 * TOTAL, e não a das linhas da página.
 *
 * ➡️ `../ListaDeFaturas/index.test.tsx`.
 */
export default function SecaoEmitidas({
  faturas, carregando, erro, onTentarDeNovo, paginacao, nomeDoCliente, onAbrir,
}: SecaoEmitidasProps) {
  const [medir, estreita] = useLarguraEstreita(LARGURA_MINIMA_DA_TABELA.faturas);
  const vazio =
    faturas.length === 0 ? (
      <EstadoVazio mensagem="Nenhuma fatura emitida neste período." />
    ) : undefined;

  if (carregando) return <Esqueleto linhas={4} />;
  if (erro) {
    return (
      <CartaoDeTabela>
        <EstadoDeErro
          mensagem="Não foi possível carregar as faturas."
          onTentarDeNovo={onTentarDeNovo}
        />
      </CartaoDeTabela>
    );
  }

  return (
    <>
      <Text fontSize="11.5px" color="fg.subtle" mb="10px">
        {paginacao.total > 0
          ? `Mostrando ${faturas.length} de ${contar(paginacao.total, "fatura emitida", "faturas emitidas")}`
          : ""}
      </Text>

      <CartaoDeTabela>
        <Box ref={medir}>
          {estreita ? (
            vazio || (
              <Box px="6px">
                {faturas.map((f) => (
                  <ItemDeFatura
                    key={f.fatura_id}
                    fatura={f}
                    nomeDoCliente={nomeDoCliente}
                    onAbrir={onAbrir}
                  />
                ))}
              </Box>
            )
          ) : (
            <Tabela colunas={COLUNAS_DE_FATURAS} vazio={vazio}>
              {faturas.map((f) => (
                <LinhaDeFatura
                  key={f.fatura_id}
                  fatura={f}
                  nomeDoCliente={nomeDoCliente}
                  onAbrir={onAbrir}
                />
              ))}
            </Tabela>
          )}
        </Box>
        <Pagination {...paginacao} />
      </CartaoDeTabela>
    </>
  );
}
