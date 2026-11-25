export interface CampoDeHorarioProps {
  /** `HH:MM`, ou `""` sem horário. */
  hora: string;
  onMudar: (hora: string) => void;
  /** `true` quando o campo tem algo que ainda não é uma hora ("09:"): o navegador entrega `""` nesse caso, e
   * tratá-lo como "sem horário" apagaria a hora que a pessoa está digitando. */
  onIncompleta: (incompleta: boolean) => void;
  onSemHorario: () => void;
  incompleta: boolean;
}
