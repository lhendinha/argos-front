import type { Cliente } from "../../../../types";

export interface FormularioClienteProps {
  cliente: Cliente;
  podeEditar: boolean;
  /** `manager`+, o piso das duas rotas de arquivamento. O cliente arquivado
   * continua EDITÁVEL: esta prop governa só os botões de arquivar e
   * reativar. */
  podeArquivar: boolean;
  arquivando?: boolean;
  reativando?: boolean;
  onSalvo: () => void;
  onArquivar: () => void;
  onReativar: () => void;
}
