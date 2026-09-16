/** O estado de qualquer coisa que se arquiva: ativo, arquivado, ou os dois.
 *
 * ⚠️ São as palavras que a API recebe em `?estado=` -- mudar qualquer uma aqui é mudar o contrato com o servidor, não um
 * rótulo. Os rótulos dos chips ficam no `constants.ts` de cada tela, que é texto.
 *
 * ⚠️ "Todos" é uma opção de verdade, e não a ausência do parâmetro: sem estado a API devolve só os ATIVOS, que é o que
 * os seletores precisam. A tela manda sempre o que está no chip.
 *
 * 🔴 Genérico desde o passo 4.4e: nasceu em clientes e agora serve também contas, centros, categorias, fases e
 * situações. Um vocabulário por tela seria a mesma palavra escrita cinco vezes, e a quinta divergiria.
 */
export const ESTADO_ATIVOS = "ativos";
export const ESTADO_ARQUIVADOS = "arquivados";
export const ESTADO_TODOS = "todos";
export const ESTADOS_DE_ARQUIVAMENTO = [ESTADO_TODOS, ESTADO_ATIVOS, ESTADO_ARQUIVADOS] as const;
