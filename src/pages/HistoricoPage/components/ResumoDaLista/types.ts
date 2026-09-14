export interface ResumoDaListaProps {
  /** Enquanto a primeira página não chega, a linha fica vazia -- o esqueleto logo abaixo já é o recado. */
  carregando: boolean;
  /** Quantos envios o filtro traz. */
  total: number;
  /** Quantos envios há sem filtro nenhum: o "de Y". */
  totalSemFiltro: number;
  /** Os não lidos com os filtros aplicados. Ausente na leitura antiga, que não os conta: aí o trecho não aparece. */
  naoLidos?: number;
}
