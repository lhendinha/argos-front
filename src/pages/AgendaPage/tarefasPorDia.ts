import { ORDEM_DAS_PRIORIDADES } from "../../constants/prioridade";
import type { PrioridadeDaTarefa, Tarefa } from "../../types";
import { compararPelaAgenda } from "../../utils/horaDaTarefa";

function pesoDaPrioridade(prioridade: string): number {
  const indice = ORDEM_DAS_PRIORIDADES.indexOf(prioridade as PrioridadeDaTarefa);
  // Prioridade desconhecida vai pro fim, nunca pro topo: um valor novo no
  // servidor não pode empurrar tudo pra baixo por acidente.
  return indice === -1 ? ORDEM_DAS_PRIORIDADES.length : indice;
}

/** A ordem em que a Agenda DESENHA as tarefas: pela data, sem horário primeiro (vale o dia inteiro), depois pela
 * hora, pela prioridade e pelo título.
 *
 * 🔴 Um comparador só, para a tela E para a âncora do Shift (`chavesVisiveis`): com a ordem do servidor no Shift,
 * selecionar entre duas tarefas clicadas marcaria uma que não está entre elas na tela.
 */
export function compararComoNaAgenda(a: Tarefa, b: Tarefa): number {
  const pela = compararPelaAgenda(a, b);
  if (pela !== 0) return pela;
  const peso = pesoDaPrioridade(a.prioridade) - pesoDaPrioridade(b.prioridade);
  // Desempate estável pelo título: sem ele, duas tarefas de mesma prioridade trocam de lugar entre renders.
  return peso !== 0 ? peso : a.titulo.localeCompare(b.titulo, "pt-BR");
}

/** Agrupa as tarefas por `data` (`aaaa-mm-dd`), cada dia na ordem de `compararComoNaAgenda`.
 *
 * Um Map montado UMA vez por consulta, em vez de peneirar o array inteiro
 * para cada célula: a grade do mês tem 42 células, e filtrar dentro de cada
 * uma varreria a lista 42 vezes.
 */
export function agruparPorDia(tarefas: Tarefa[]): Map<string, Tarefa[]> {
  const porDia = new Map<string, Tarefa[]>();
  for (const tarefa of tarefas) {
    if (!tarefa.data) continue;
    const doDia = porDia.get(tarefa.data);
    if (doDia) doDia.push(tarefa);
    else porDia.set(tarefa.data, [tarefa]);
  }
  for (const doDia of porDia.values()) doDia.sort(compararComoNaAgenda);
  return porDia;
}

/** O filtro de pessoa da Agenda, aplicado no cliente: `"todas"`, `"sem"`
 * (sem responsável) ou o e-mail de quem é responsável. */
export function filtrarPorPessoa(tarefas: Tarefa[], pessoa: string): Tarefa[] {
  if (pessoa === "todas") return tarefas;
  if (pessoa === "sem") return tarefas.filter((t) => !t.responsavel_id);
  return tarefas.filter((t) => t.responsavel_id === pessoa);
}
