/** O aviso antes da tarefa: o padrão, o teto e as escolhas rápidas do formulário.
 *
 * 🔴 O teto e o padrão são os do servidor (`AVISO_MINUTOS_MAXIMO`, `AVISO_MINUTOS_PADRAO` na entidade `Tarefa`):
 * acima do teto a API responde 400, e o formulário não deixa chegar lá.
 */

/** Ligado, o aviso vem com uma hora de antecedência. */
export const AVISO_MINUTOS_PADRAO = 60;
/** Sete dias. */
export const AVISO_MINUTOS_MAXIMO = 7 * 24 * 60;

/** As escolhas de um clique; o resto é "Outro", com número e unidade. */
export const AVISOS_RAPIDOS = [
  { rotulo: "5 min", minutos: 5 },
  { rotulo: "10 min", minutos: 10 },
  { rotulo: "15 min", minutos: 15 },
  { rotulo: "30 min", minutos: 30 },
  { rotulo: "1 h", minutos: 60 },
  { rotulo: "3 h", minutos: 180 },
  { rotulo: "1 dia", minutos: 1440 },
] as const;

/** As unidades do "Outro", pelo tanto de minutos de cada uma. */
export const UNIDADES_DO_AVISO = [
  { value: "1", label: "minutos" },
  { value: "60", label: "horas" },
  { value: "1440", label: "dias" },
] as const;
