import type { Cliente, EstadoDeCliente } from "../../../../types";

export interface TabelaClientesProps {
  clientes: Cliente[];
  busca: string;
  /** O chip escolhido -- decide as colunas e se a linha do arquivado mostra
   * "Reativar". */
  estado: EstadoDeCliente;
  /** `manager`+, o mesmo piso da API. Sem isso a coluna de ação fica vazia:
   * mostrar um botão que o servidor vai negar é pior que não mostrar. */
  podeArquivar: boolean;
  onReativar: (cliente: Cliente) => void;
  /** Qual linha está reativando agora -- trava só o botão dela, como em
   * `LinhaDeOpcao`: travar a lista toda esconde qual está mudando. */
  reativandoId?: string;
  onLimparBusca: () => void;
}
