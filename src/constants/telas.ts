/** As réguas de TELA do sistema, juntas -- e elas são quatro, de propósito.
 *
 * 🔴 **Unificar num número só é a tentação errada, e o código já sabia
 * disso.** Cada régua responde a uma pergunta diferente: "cabe um menu de
 * 236px mais uma coluna de leitura?" (768, na casca), "o diálogo de 560px
 * fica apertado?" (599), "cabem sete colunas de semana?" (840), "cabem dois
 * campos lado a lado?" (480). São perguntas sobre conteúdos de tamanhos
 * diferentes; dar a mesma resposta a todas muda a tela errada. O que faltava
 * não era um número -- era este arquivo, onde as quatro podem ser lidas uma
 * ao lado da outra por quem for criar a quinta.
 *
 * 🔴 **Aperto tem DUAS dimensões, e esquecer a segunda é o erro que este
 * arquivo existe para não deixar repetir.** O diálogo já aprendeu: um
 * iPhone deitado (832x334) passa com sobra em qualquer régua de largura e
 * não cabe de jeito nenhum. A visão por mês da Agenda cometia o mesmo erro
 * em silêncio -- media em 390x844 a célula encolhia, e em 832x334 ela ficava
 * alta porque 832 passa de 640: 476px da grade abaixo da dobra, justamente
 * na tela em que a "visão de conjunto do mês" mais faz falta. Régua de
 * ALTURA para problema de altura.
 *
 * ⚠️ **Estas são de VIEWPORT. As de CONTAINER moram em `lista.ts`**
 * (`LARGURA_MINIMA_DA_TABELA`), e a diferença não é estilo: a mesma lista
 * tem larguras diferentes na mesma janela -- com o menu recolhido a área de
 * conteúdo ganha uns 236px sem a viewport mudar um pixel. Tabela pergunta ao
 * container; tela pergunta à tela.
 *
 * ⚠️ **A régua da casca não está aqui**, e é a exceção anotada: ela é o
 * `md` do Chakra (768px), aplicado por prop responsiva e não por media query
 * escrita. Ver `useMenuDaCasca`.
 */

/** Quando um diálogo deixa de ser uma janela centralizada e vira uma FOLHA
 * que ocupa a tela toda.
 *
 * 🔴 **A régua é OUTRA, e não a da casca** (`useMenuDaCasca`), de propósito.
 * A casca pergunta "cabe um menu de 236px MAIS uma coluna de leitura?" e
 * responde 768px. Aqui a pergunta é "o diálogo de 560px fica apertado?", e
 * a resposta é outra: o iPad mini em pé tem 744px e mostra esse diálogo com
 * folga -- transformá-lo em folha de tela cheia ali seria pesado. Usar uma
 * régua só porque é uma régua só faria a tela errada mudar.
 *
 * ⚠️ **A ALTURA entra junto, e é ela que pega o celular deitado.** Medido no
 * iPhone 17 Pro Max em paisagem (832x334): a largura passa com sobra e o
 * diálogo não cabe de jeito nenhum -- o painel media 560x407 numa tela de
 * 334, com o rodapé inteiro fora. Uma régua só de largura o deixaria
 * centralizado justamente onde ele não cabe.
 */
export const TELA_APERTADA_PARA_DIALOGO = "(max-width: 599px), (max-height: 599px)";

/** Quando a célula da visão por mês encolhe de 84px para 52px.
 *
 * 🔴 **A grade de seis semanas precisa caber INTEIRA, senão a visão por mês
 * não tem razão de existir** -- ela é a única da Agenda que mostra o mês de
 * uma vez. Com 84px ela mede 544px e começa por volta dos 265px do topo:
 * pede uns 810px de janela. Com 52px cai para 352px.
 *
 * 🔴 **A altura foi acrescentada depois, e é o que conserta o celular
 * deitado.** A regra era só `max-width: 640px`, com a justificativa de que
 * "a grade não cabe na tela" -- razão vertical, régua horizontal. Medido nos
 * quatro formatos da régua do mobile: em 832x334 a célula ficava em 84px
 * porque 832 passa de 640, e 476px da grade iam para baixo da dobra. É o
 * mesmo erro que `TELA_APERTADA_PARA_DIALOGO` já tinha anotado.
 *
 * ⚠️ **899 e não 810**: a janela precisa da folga do cabeçalho e das abas,
 * que variam com a largura. Medido: em 390x844 a grade alta terminaria em
 * 897px, 53 além da janela -- por isso 844 fica com a célula baixa. Em
 * 1440x900 ela termina em 811 e a alta cabe.
 */
export const TELA_SEM_ESPACO_PARA_O_MES = "(max-width: 640px), (max-height: 899px)";

/** Quando a visão por semana para de encolher e passa a ROLAR de lado.
 *
 * 🔴 **Só largura, e aqui está certo:** sete colunas é problema horizontal.
 * Abaixo disto a faixa rola com coluna de 112px em vez de espremer -- sete
 * colunas num celular dariam ~50px cada, e o título da tarefa viraria duas
 * letras e reticências.
 *
 * ⚠️ **840 é do artifact, e o `md` do Chakra (768) não serve:** perto o
 * bastante para parecer igual e longe o bastante para deixar tablet estreito
 * com sete colunas espremidas.
 */
export const TELA_ESTREITA_PARA_A_SEMANA = "(max-width: 840px)";

/** Quando um par de campos passa a caber lado a lado.
 *
 * ⚠️ **É o `sm` do Chakra (30rem = 480px) escrito à mão**, e a razão de
 * existir a cópia é uma só: a prop responsiva do Chakra compila para
 * `@media SCREEN and (min-width: 30rem)`, e no PAPEL a grade desabava para
 * uma coluna. Medido no documento da fatura: `544px 544px` na tela e
 * `1402px` na impressão. Esta versão é crua, sem `screen`, e a fatura
 * impressa mantém o par lado a lado.
 *
 * ⚠️ Quem não imprime usa a prop do Chakra e não esta constante -- ver
 * `LinhaDeCampos` e o `curto` do `Campo`. Duas grafias da mesma medida, e a
 * diferença entre elas é o papel.
 */
export const TELA_DE_DUAS_COLUNAS = "(min-width: 480px)";
