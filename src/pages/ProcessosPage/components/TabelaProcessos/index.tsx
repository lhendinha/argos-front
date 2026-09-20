import { Box } from "@chakra-ui/react";

import { Botao, EstadoVazio, Tabela } from "../../../../components";
import { LIMIAR_DA_LISTA_EM_ITENS } from "../../../../constants";
import { useLarguraEstreita } from "../../../../hooks/useLarguraEstreita";
import { COLUNAS_PROCESSOS } from "../../constants";
import ItemDeProcesso from "../ItemDeProcesso";
import LinhaProcesso from "../LinhaProcesso";
import type { TabelaProcessosProps } from "./types";

/** Os processos como TABELA onde cabem as sete colunas, e como ITENS de
 * várias linhas onde não cabem.
 *
 * 🔴 **Duas árvores, e não a mesma com outro CSS.** No item o nome sobe, o
 * número desce, cliente e subgrupo viram etiquetas e situação e prazo vão
 * para um rodapé -- é outra marcação, e quem escolhe entre duas árvores é o
 * JavaScript. O limiar é medido no CONTAINER, não na janela: ver
 * `useLarguraEstreita`.
 *
 * ⚠️ O estado vazio é o MESMO nos dois caminhos. Ele já distinguia "vazio
 * por filtro" de "vazio de verdade", e uma segunda cópia perderia essa
 * distinção no primeiro ajuste. */
export default function TabelaProcessos({
  processos,
  filtroAtivo,
  onLimparFiltros,
  subgrupoNome,
  clientesNomes,
  faseRotulo,
  situacaoRotulo,
  onAbrir,
}: TabelaProcessosProps) {
  const [medir, estreita] = useLarguraEstreita(LIMIAR_DA_LISTA_EM_ITENS);

  const vazio = processos.length === 0 && (
    <EstadoVazio
            /* Vazio por filtro é diferente de vazio de verdade: sem
               distinguir, a pessoa acha que não cadastrou nada. */
            mensagem={
              filtroAtivo
                ? "Nenhum processo com os filtros atuais."
                : "Nenhum processo cadastrado ainda."
            }
      acao={
        filtroAtivo && (
          <Botao variante="ghost" onClick={onLimparFiltros}>
            Limpar filtros
          </Botao>
        )
      }
    />
  );

  const comuns = { subgrupoNome, clientesNomes, faseRotulo, situacaoRotulo, onAbrir };

  return (
    <Box ref={medir}>
      {estreita ? (
        vazio || (
          <Box px="6px">
            {processos.map((p) => (
              <ItemDeProcesso key={`${p.subgrupo_id}-${p.numero_processo}`} processo={p} {...comuns} />
            ))}
          </Box>
        )
      ) : (
        <Tabela colunas={COLUNAS_PROCESSOS} vazio={vazio}>
          {processos.map((p) => (
            <LinhaProcesso key={`${p.subgrupo_id}-${p.numero_processo}`} processo={p} {...comuns} />
          ))}
        </Tabela>
      )}
    </Box>
  );
}
