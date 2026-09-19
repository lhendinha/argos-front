import type { Comunicacao } from "../../../../types";

export interface ModalDeMovimentacaoProps {
  comunicacao: Comunicacao;
  /** O número do processo, para buscar o TEOR.
   *
   * ⚠️ Vem de fora, e não de `comunicacao.numero_processo`: a lista do
   * detalhe existe para mostrar tipo, data e órgão, e depender de um campo
   * dela aqui amarraria o modal ao que a lista carrega. */
  numeroProcesso: string;
  /** Leva ao e-mail que avisou desta movimentação, no Histórico. Ausente
   * quando não houve e-mail -- ver `tem_envio`. */
  onVerOEnvio?: () => void;
  /** Abre o formulário de tarefa já vinculado a este processo. */
  onAdicionarTarefa: () => void;
  onFechar: () => void;
}
