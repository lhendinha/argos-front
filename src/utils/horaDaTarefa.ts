/** A hora da tarefa: o relógio de Brasília, quando uma tarefa aberta está atrasada, e o aviso em número e unidade.
 *
 * 🔴 `estaAtrasada` espelha `horario_da_tarefa.esta_atrasada` da API, com os mesmos casos de teste: a lista
 * "Atrasadas" vem do servidor, e aqui a regra só pinta a etiqueta -- divergindo, a cor contradiria a lista.
 * ⚠️ Brasília, nunca o relógio do navegador: quem abre de outro fuso veria a tarefa atrasar na hora errada.
 * ➡️ `utils/horaDaTarefa.test.ts`
 */
import { UNIDADES_DO_AVISO } from "../constants/aviso";

const FORMATO_DE_BRASILIA = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** O dia (`aaaa-mm-dd`) e a hora (`HH:MM`) de Brasília no instante dado. */
export function agoraEmBrasilia(instante: Date = new Date()): { dia: string; hora: string } {
  const partes = Object.fromEntries(FORMATO_DE_BRASILIA.formatToParts(instante).map((p) => [p.type, p.value]));
  return { dia: `${partes.year}-${partes.month}-${partes.day}`, hora: `${partes.hour}:${partes.minute}` };
}

/** Se a tarefa ABERTA com esta data e hora passou do prazo: data anterior a hoje, ou hoje com a hora passada.
 *
 * ⚠️ A hora é o INÍCIO do atraso: às 09:00 a tarefa das 09:00 ainda não está atrasada; às 09:01, está.
 */
export function estaAtrasada(
  data: string,
  hora: string | null | undefined,
  agora: { dia: string; hora: string } = agoraEmBrasilia(),
): boolean {
  if (data < agora.dia) return true;
  return data === agora.dia && Boolean(hora) && (hora as string) < agora.hora;
}

/** A antecedência como número e unidade EXATOS: 90 minutos são "90 minutos", nunca "1,5 hora".
 *
 * ⚠️ A maior unidade que divide sem resto. Arredondar mostraria um aviso diferente do que está gravado, e salvar
 * sem mexer gravaria o arredondado.
 */
export function avisoEmUnidade(minutos: number): { numero: number; unidade: string } {
  for (const { value } of [...UNIDADES_DO_AVISO].reverse()) {
    const tamanho = Number(value);
    if (minutos % tamanho === 0) return { numero: minutos / tamanho, unidade: value };
  }
  return { numero: minutos, unidade: "1" };
}

/** A tarefa antes, pela data e depois pela hora -- sem hora primeiro, porque vale o dia inteiro. */
export function compararPelaAgenda(
  a: { data: string; hora?: string | null },
  b: { data: string; hora?: string | null },
): number {
  if (a.data !== b.data) return a.data < b.data ? -1 : 1;
  const ha = a.hora ?? "";
  const hb = b.hora ?? "";
  return ha === hb ? 0 : ha < hb ? -1 : 1;
}

/** O nome da tarefa para quem lê em voz alta ou escolhe entre parecidas: com títulos repetidos ("Audiência"), é a
 * hora que distingue uma da outra. */
export function nomeComHora(tarefa: { titulo: string; hora?: string | null }): string {
  return tarefa.hora ? `${tarefa.titulo}, às ${tarefa.hora}` : tarefa.titulo;
}
