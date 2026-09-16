/** O estado de um cliente na listagem: ativo, arquivado, ou os dois.
 *
 * ⚠️ São as palavras que a API recebe em `GET /clientes?estado=` -- mudar
 * qualquer uma aqui é mudar o contrato com o servidor, não um rótulo. O
 * rótulo do chip fica em `ClientesPage/constants.ts`, que é texto de tela.
 *
 * ⚠️ "Todos" é uma opção de verdade do servidor, e não a ausência do
 * parâmetro: sem estado a API devolve só os ATIVOS, que é o que o seletor de
 * cliente precisa. A tela manda sempre o que está no chip.
 */
export const ESTADO_DE_CLIENTE_ATIVOS = "ativos";
export const ESTADO_DE_CLIENTE_ARQUIVADOS = "arquivados";
export const ESTADO_DE_CLIENTE_TODOS = "todos";
export const ESTADOS_DE_CLIENTE = [
  ESTADO_DE_CLIENTE_TODOS,
  ESTADO_DE_CLIENTE_ATIVOS,
  ESTADO_DE_CLIENTE_ARQUIVADOS,
] as const;
