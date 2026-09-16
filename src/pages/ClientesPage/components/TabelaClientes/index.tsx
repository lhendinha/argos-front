import { Botao, EstadoVazio, Tabela } from "../../../../components";
import { ESTADO_DE_CLIENTE_ARQUIVADOS } from "../../../../constants";
import { colunasDeClientes } from "../../constants";
import LinhaCliente from "../LinhaCliente";
import type { TabelaClientesProps } from "./types";

/** A tabela de clientes, nas colunas do artefato -- que mudam com o chip:
 * "Arquivados" troca a coluna Processos pela de ação, e "Todos" tem as duas.
 */
export default function TabelaClientes({
  clientes,
  busca,
  estado,
  podeArquivar,
  onReativar,
  reativandoId,
  onLimparBusca,
}: TabelaClientesProps) {
  return (
    <Tabela
      colunas={colunasDeClientes(estado)}
      vazio={
        clientes.length === 0 && (
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
        )
      }
    >
      {clientes.map((c) => (
        <LinhaCliente
          key={c.cliente_id}
          cliente={c}
          estado={estado}
          podeReativar={podeArquivar}
          onReativar={() => onReativar(c)}
          reativando={reativandoId === c.cliente_id}
        />
      ))}
    </Tabela>
  );
}
