/** Abaixo desta largura de CONTAINER, a lista larga deixa de ser tabela e
 * vira itens de várias linhas.
 *
 * 🔴 Do CONTAINER, e não da janela: a mesma lista tem larguras diferentes na
 * mesma janela -- com o menu recolhido a área de conteúdo ganha uns 236px
 * sem a viewport mudar um pixel.
 *
 * ⚠️ 640px é onde uma tabela de sete colunas deixa de mostrar o suficiente
 * para se ler rolando: abaixo disso aparecem três colunas, e rolar para ver
 * a quarta tira da vista justamente a primeira, que é a que identifica a
 * linha. Acima, a rolagem lateral ainda responde "de quem é esta linha?".
 */
export const LIMIAR_DA_LISTA_EM_ITENS = 640;
