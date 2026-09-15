import type { ContaFinanceira } from "../../../../types";
import type { OpcoesBuscaveis } from "../../../../types";
import type { FiltrosDaListaDeLancamentos } from "../../types";

export interface FiltrosDeLancamentosProps {
  filtros: FiltrosDaListaDeLancamentos;
  /** Recebe só o que mudou -- a página junta com o resto. */
  onMudar: (mudanca: Partial<FiltrosDaListaDeLancamentos>) => void;
  /** As contas do catálogo, que a tela já leu inteiro. */
  contas: ContaFinanceira[];
  /** Os departamentos, buscáveis: são os subgrupos do escritório. */
  departamentos: OpcoesBuscaveis;
  /** O texto escrito ainda não é o buscado: a espera entre teclas ou a consulta em voo. */
  buscando?: boolean;
}
