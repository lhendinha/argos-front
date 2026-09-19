/** Quando um apertar vira um arrastar, no mouse e no dedo.
 *
 * 🔴 **São dois sensores, um por entrada, porque mouse e dedo precisam de
 * regras opostas.** Um sensor de ponteiro só trata os dois como a mesma
 * coisa: ativa por DISTÂNCIA, e no dedo qualquer distância também é o começo
 * de uma rolagem. Medido no Safari 26.1 e no Chrome 134: os cartões do quadro
 * chegam com `touch-action: auto`, então o dedo rolava a página e o cartão
 * nunca saía do lugar -- arrastar tarefa entre colunas simplesmente não
 * funcionava no toque.
 *
 * 🔴 **No dedo a régua é TEMPO, não distância.** Pressionar e segurar não se
 * confunde com rolar: quem rola move o dedo antes dos 250ms, e a tolerância
 * de 8px cancela o arraste nesse caso. É o que deixa a MESMA superfície
 * servir para rolar a coluna e para mover o cartão, sem um "pegador"
 * separado -- que seria um alvo a mais de 44px dentro de um cartão de 12px
 * de recuo.
 *
 * ⚠️ 250ms é o limite prático: abaixo disso o arraste dispara durante uma
 * rolagem lenta; acima, o gesto começa a parecer que não respondeu.
 */
export const ATIVACAO_DO_MOUSE = { distance: 4 } as const;
export const ATIVACAO_DO_TOQUE = { delay: 250, tolerance: 8 } as const;
