/** O estado de um cliente na listagem -- apelidos do vocabulário geral.
 *
 * ⚠️ Os nomes ficam porque a tela de Clientes já os usa e eles se leem melhor lá ("estado DE CLIENTE"). O valor é o
 * mesmo de `constants/arquivamento.ts`, que é quem manda: duas listas independentes divergiriam no primeiro ajuste.
 */
import {
  ESTADO_ARQUIVADOS,
  ESTADO_ATIVOS,
  ESTADO_TODOS,
  ESTADOS_DE_ARQUIVAMENTO,
} from "./arquivamento";

export const ESTADO_DE_CLIENTE_ATIVOS = ESTADO_ATIVOS;
export const ESTADO_DE_CLIENTE_ARQUIVADOS = ESTADO_ARQUIVADOS;
export const ESTADO_DE_CLIENTE_TODOS = ESTADO_TODOS;
export const ESTADOS_DE_CLIENTE = ESTADOS_DE_ARQUIVAMENTO;
