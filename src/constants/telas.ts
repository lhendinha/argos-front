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
 * ⚠️ **Quase todas são de VIEWPORT; a última é de CONTAINER**, e a
 * diferença não é estilo: a mesma caixa tem larguras diferentes na mesma
 * janela -- com o menu recolhido a área de conteúdo ganha uns 236px sem a
 * viewport mudar um pixel. As de lista moram em `lista.ts`
 * (`LARGURA_MINIMA_DA_TABELA`), porque envelhecem com as colunas de cada
 * uma; esta fica aqui porque é régua de uma tela só.
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

/** Abaixo desta largura de CONTAINER, o documento da fatura deixa de ser
 * três colunas e empilha.
 *
 * 🔴 **Três colunas não cabem num celular pequeno, e não há conserto
 * estável.** Medido em 360px (318 de área útil), com descrição longa: a
 * tabela pede 327px, e 342 quando o valor é R$ 123.456,78 -- o valor é o
 * único dos três conteúdos que cresce sem limite conhecido. Tentei cada
 * saída e medi as duas pontas: cabeçalho sem caixa-alta (318 / 327), valor
 * fora da monoespaçada (318 / 331), recuo de 12px (318 / 330). Todas cabem
 * com valor pequeno, todas estouram com valor grande, e cada uma custa uma
 * convenção do sistema. O que cortava era o VALOR, numa fatura.
 *
 * 🔴 **Consulta de CONTAINER, e não media query nem JavaScript**, e isto é
 * o ponto: a fatura se imprime. A prop responsiva do Chakra vira
 * `@media SCREEN and ...` e não vale no papel; `useLarguraEstreita` troca a
 * ÁRVORE por JS e o papel herda a árvore da tela -- medido, Clientes numa
 * janela de 360px imprime zero tabelas. A consulta de container é CSS puro e
 * o layout de impressão usa a largura do PAPEL: medido em PDF A4 gerado de
 * uma janela de 360px, com e sem a pilha, **0pt de diferença**. No papel o
 * container tem 784px e continua tabela.
 *
 * ⚠️ **420 é folga sobre o pior caso medido**, e não o limite exato: o
 * mínimo da tabela vai de 327 a ~360 conforme o valor, então empilhar só aos
 * 360 deixaria a tabela raspando a borda. E fica bem abaixo da área de
 * conteúdo de qualquer desktop -- medido, no iPad mini em pé o container tem
 * mais que isto e continua tabela.
 */
export const CONTAINER_PARA_EMPILHAR_O_DOCUMENTO = "(max-width: 420px)";

/** Abaixo desta largura de CONTAINER, a área de conteúdo é de celular: as
 * ações do cabeçalho ocupam a linha inteira e os filtros descem para baixo
 * da busca.
 *
 * 🔴 **De container, e não de janela**, pela razão de sempre: a área de
 * conteúdo encolhe quando o menu fixo aparece. Medido: até 744px de janela
 * ela vale a janela inteira; numa janela de 1024 ela tem 812, e numa de 1440,
 * 1181. Uma régua de janela responderia "desktop" para uma coluna de 812.
 *
 * ⚠️ **480 separa celular de tablet, e é escolha de desenho.** Botão que
 * ocupa a linha toda é certo no polegar e estranho num iPad mini em pé, que
 * tem 744px de container -- lá os botões continuam do tamanho do texto.
 *
 * ⚠️ O container já existe: o `AppShell` declara `containerType` na área de
 * conteúdo, que é o que dá as medidas em `cqi` do recuo do `main`. Esta
 * régua lê o mesmo.
 */
export const CONTAINER_DE_CELULAR = "(max-width: 480px)";

/** A partir desta largura de CONTAINER, a Área de trabalho abre em duas
 * colunas.
 *
 * 🔴 **Era `lg` do Chakra (992px de JANELA), e a janela mente aqui.** Num
 * iPad mini deitado a janela tem 1024 e responde "duas colunas", mas quem
 * reparte é a área de conteúdo, que tem 812 por causa do menu fixo. A
 * coluna estreita saía com 291px, e "Minhas atividades" empurrava a página
 * para 1040 numa tela de 1024 -- nos DOIS motores, Chromium e WebKit.
 *
 * ⚠️ **980 é conta, não gosto.** Medi o mínimo de cada coluna com o banco
 * local cheio: a estreita pede 358px (os três quadros de "Minhas
 * atividades" -- a palavra "CONCLUÍDAS" sozinha ocupa 80px e não quebra) e
 * a larga 355 ("Vence esta semana"). Com `1.5fr / 1fr` e 20 de intervalo, a
 * estreita recebe `(G - 20) / 2.5`, então o GRID precisa de 915.
 *
 * 🔴 **E o grid não é o container: o `main` come 64px de recuo.** Foi o erro
 * que eu mesmo cometi antes de medir -- com o limiar em 920 uma janela de
 * 1152 dava container 940, grid 876, coluna estreita 304, e a fileira de
 * 320 continuava estourando. O documento NÃO crescia, porque o estouro fica
 * dentro do cartão: por isso a régua do mobile passava. 915 + 64 = 979,
 * arredondado para 980.
 *
 * ⚠️ **O desktop não sente.** Numa janela de 1440 o container tem 1181 e
 * numa de 1280, 1050 -- as duas seguem em duas colunas, e o diff de pixel
 * em 1440 deu zero. Quem muda é a faixa que estava quebrada.
 */
export const CONTAINER_DE_DUAS_COLUNAS_DO_PAINEL = "(min-width: 980px)";
