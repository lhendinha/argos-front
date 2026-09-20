export interface InterruptorDaInscricaoProps {
  /** O número da inscrição -- só para compor o `id` do estado, que precisa
   * ser único entre as 50 linhas. */
  inscricao: string;
  /** `id` do elemento que DESENHA o número. O interruptor aponta para ele em
   * vez de repetir o texto -- ver o componente. */
  idDoRotulo: string;
  ligada: boolean;
  desabilitado: boolean;
  /** Ligar e desligar são ações DIFERENTES -- ver o componente. */
  onLigar: () => void;
  onDesligar: () => void;
}
