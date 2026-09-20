import type { HistoricoItem } from "../../../../types";

export interface ListaDeHistoricoProps {
  historico: HistoricoItem[];
  /** Traduz `subgrupos_notificados` nos nomes que a pessoa PODE ver,
   * descartando os demais. Vem da página -- uma consulta para a lista
   * inteira, não uma por linha. */
  subgruposVisiveis: (ids: string[] | undefined) => string[];
  onAbrir: (item: HistoricoItem) => void;
}
