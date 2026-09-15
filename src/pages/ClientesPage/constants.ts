import {
  ESTADO_DE_CLIENTE_ARQUIVADOS,
  ESTADO_DE_CLIENTE_ATIVOS,
  ESTADO_DE_CLIENTE_TODOS,
  ESTADOS_DE_CLIENTE,
} from "../../constants";
import type { EstadoDeCliente } from "../../types";

/** As três opções do chip, na ordem do artefato: "Todos" primeiro, e a tela
 * abre em "Ativos".
 *
 * ⚠️ `rotulo` é texto de tela; o `id` é a palavra que vai para a API. Ficaram
 * lado a lado de propósito, como em `AtendimentosPage/constants.ts`. */
export const OPCOES_DE_ESTADO = [
  { id: ESTADO_DE_CLIENTE_TODOS, rotulo: "Todos" },
  { id: ESTADO_DE_CLIENTE_ATIVOS, rotulo: "Ativos" },
  { id: ESTADO_DE_CLIENTE_ARQUIVADOS, rotulo: "Arquivados" },
] as const;

/** O estado que veio da URL, ou "Ativos".
 *
 * 🔴 A URL é digitável: `?estado=apagados` chegaria à API como filtro
 * desconhecido e voltaria 422, com a tela dizendo só "não foi possível
 * carregar". Aqui o desconhecido vira o padrão, que é o que a tela mostra
 * para quem não escolheu nada.
 */
export function estadoDeClienteValido(valor: string): EstadoDeCliente {
  return (ESTADOS_DE_CLIENTE as readonly string[]).includes(valor)
    ? (valor as EstadoDeCliente)
    : ESTADO_DE_CLIENTE_ATIVOS;
}

/** Cabeçalhos da tabela de Clientes, na ordem do artefato.
 *
 * 🔴 As colunas MUDAM com o filtro, e é o artefato validado que decide: em
 * "Arquivados" a coluna Processos sai (cliente com processo não se arquiva,
 * então ela seria uma coluna de zeros), e em "Arquivados" e "Todos" entra a
 * coluna de ação, sem nome, onde mora o "Reativar".
 */
export function colunasDeClientes(estado: EstadoDeCliente) {
  const base = ["Nome", "Documento", "Contato"];
  if (estado !== ESTADO_DE_CLIENTE_ARQUIVADOS) base.push("Processos");
  return estado === ESTADO_DE_CLIENTE_ATIVOS ? base : [...base, ""];
}
