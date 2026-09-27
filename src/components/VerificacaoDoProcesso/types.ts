import type { Processo } from "../../types";

export interface VerificacaoDoProcessoProps {
  processo: Pick<Processo, "verificado_ate" | "verificacao_atrasada" | "historico_em_carga">;
  /** No detalhe o rótulo abre a frase ("Verificado até..."); na lista vem depois da data, em minúscula. */
  inicioDeFrase?: boolean;
}
