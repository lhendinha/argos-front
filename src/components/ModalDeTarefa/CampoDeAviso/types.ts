export interface CampoDeAvisoProps {
  /** Minutos antes da hora; `null` = sem aviso. */
  minutos: number | null;
  onMudar: (minutos: number | null) => void;
}
