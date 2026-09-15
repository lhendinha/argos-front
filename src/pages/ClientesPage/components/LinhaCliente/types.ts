import type { Cliente, EstadoDeCliente } from "../../../../types";

export interface LinhaClienteProps {
  cliente: Cliente;
  /** O chip escolhido: decide a etiqueta, a coluna de processos e a de ação. */
  estado: EstadoDeCliente;
  /** `manager`+, o piso da API. Sem isso a célula de ação fica vazia. */
  podeReativar: boolean;
  onReativar: () => void;
  /** Esta linha está reativando agora -- trava só o botão dela. */
  reativando?: boolean;
}
