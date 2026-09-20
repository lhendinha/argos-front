import { Box } from "@chakra-ui/react";

import { Botao, EstadoVazio, Tabela } from "../../../../components";
import { ESTADO_DE_CLIENTE_ARQUIVADOS, LARGURA_MINIMA_DA_TABELA } from "../../../../constants";
import { useLarguraEstreita } from "../../../../hooks/useLarguraEstreita";
import { colunasDeClientes } from "../../constants";
import ItemDeCliente from "../ItemDeCliente";
import LinhaCliente from "../LinhaCliente";
import type { TabelaClientesProps } from "./types";

/** Os clientes como TABELA onde cabem as colunas -- que mudam com o chip:
 * "Arquivados" troca a coluna Processos pela de ação, e "Todos" tem as duas
 * -- e como ITENS de várias linhas onde não cabem. Ver `TabelaProcessos`,
 * que estabeleceu o padrão. */
export default function TabelaClientes({
  clientes,
  busca,
  estado,
  podeArquivar,
  onReativar,
  reativandoId,
  onLimparBusca,
}: TabelaClientesProps) {
  const [medir, estreita] = useLarguraEstreita(LARGURA_MINIMA_DA_TABELA.clientes);

  const vazio = clientes.length === 0 && (
    <EstadoVazio
            /* Vazio por busca é diferente de vazio de verdade: sem
               distinguir, a pessoa acha que não cadastrou nada. E vazio por
               FILTRO é um terceiro caso: "nenhum cliente cadastrado" seria
               falso numa tela que está mostrando só os arquivados. */
            mensagem={
              busca
                ? `Nenhum cliente para “${busca}”.`
                : estado === ESTADO_DE_CLIENTE_ARQUIVADOS
                  ? "Nenhum cliente arquivado."
                  : "Nenhum cliente cadastrado ainda."
            }
      acao={
        busca && (
          <Botao variante="ghost" onClick={onLimparBusca}>
            Limpar busca
          </Botao>
        )
      }
    />
  );

  const propsDe = (c: (typeof clientes)[number]) => ({
    cliente: c,
    estado,
    podeReativar: podeArquivar,
    onReativar: () => onReativar(c),
    reativando: reativandoId === c.cliente_id,
  });

  return (
    <Box ref={medir}>
      {estreita ? (
        vazio || (
          <Box px="6px">
            {clientes.map((c) => (
              <ItemDeCliente key={c.cliente_id} {...propsDe(c)} />
            ))}
          </Box>
        )
      ) : (
        <Tabela colunas={colunasDeClientes(estado)} vazio={vazio}>
          {clientes.map((c) => (
            <LinhaCliente key={c.cliente_id} {...propsDe(c)} />
          ))}
        </Tabela>
      )}
    </Box>
  );
}
