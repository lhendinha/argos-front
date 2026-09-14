import type { PaginationProps } from "../../../../components/Pagination/types";
import type { NaoCobrada } from "../../../../types";

export interface SecaoNaoCobradasProps {
  /** Só as da PÁGINA atual. */
  itens: NaoCobrada[];
  carregando: boolean;
  erro: boolean;
  onTentarDeNovo: () => void;
  /** Repassado inteiro ao `Pagination`, como em "A faturar" e "Emitidas". */
  paginacao: PaginationProps;
  /** A linha abre o detalhe do lançamento. */
  onAbrir: (lancamentoId: string) => void;
  onVoltarACobrar: (despesa: NaoCobrada) => void;
  /** A despesa voltando a ser cobrada agora: o botão dela fica desabilitado contra o segundo clique. */
  voltando: string;
}
