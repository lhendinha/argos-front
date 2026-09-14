import type { PaginationProps } from "../../../../components/Pagination/types";
import type { ClienteAFaturar } from "../../../../types";

export interface SecaoAFaturarProps {
  /** Só os da PÁGINA atual, e só o resumo de cada um: os lançamentos vêm ao
   * abrir a emissão. */
  clientes: ClienteAFaturar[];
  carregando: boolean;
  erro: boolean;
  onTentarDeNovo: () => void;
  /** Repassado inteiro ao `Pagination`, que decide sozinho se aparece e
   * corrige a página que deixou de existir -- como em "Emitidas". */
  paginacao: PaginationProps;
  /** Clicar num cliente abre a emissão dele -- é o único caminho para criar
   * uma fatura. */
  onEmitir: (cliente: ClienteAFaturar) => void;
}
