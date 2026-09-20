/** Abaixo desta largura de CONTAINER, cada lista larga deixa de ser tabela e
 * vira itens de várias linhas.
 *
 * 🔴 **Um número POR LISTA, e não um para todas.** Era 640px para as quinze,
 * e a régua do mobile passou a cobrar tabela que rola dentro da própria área
 * -- foi aí que a conta apareceu: entre 640 e a largura que a tabela precisa,
 * o item já saiu de cena e a tabela ainda não cabe. Ela rola de lado. Em
 * Processos essa faixa morta tinha 428px, e num iPad mini em pé 393px da
 * tabela ficavam escondidos: via-se "Processo" e "Cliente", e para ler
 * "Situação" era preciso arrastar -- tirando da vista justamente a coluna que
 * identifica a linha.
 *
 * 🔴 Do CONTAINER, e não da janela: a mesma lista tem larguras diferentes na
 * mesma janela -- com o menu recolhido a área de conteúdo ganha uns 236px
 * sem a viewport mudar um pixel.
 *
 * ⚠️ **Um por lista, com UMA exceção**: as três seções do catálogo do
 * Financeiro (contas, categorias, centros) dividem o mesmo, porque são a
 * mesma tela. O porquê está junto delas, embaixo.
 *
 * ⚠️ **Cada número é a largura MÍNIMA medida da tabela dele**, com o banco
 * local cheio: a tabela renderizada num container estreito não encolhe abaixo
 * do conteúdo, então o `scrollWidth` ali é o mínimo. Dado maior que o do
 * banco local ainda pode estourar -- e é para isso que a `Table.ScrollArea`
 * continua existindo. O que estes números tiram é o estouro ESTRUTURAL, que
 * acontecia com qualquer dado.
 *
 * ⚠️ Eles envelhecem com as colunas. Coluna nova pede medida nova, e a régua
 * do mobile acusa quem esquecer.
 *
 * ⚠️ **E envelhecem com a TIPOGRAFIA também.** `processos` e
 * `previaDaImportacao` subiram quando o identificador de processo deixou os
 * 12,5px e passou a escrever nos 13px da célula (ver `CelulaComSub`): medi
 * 1068 → 1075 em Processos, com o mesmo banco local que deu o 1068, e +10 na
 * prévia. Sete pixels não parecem nada, mas o limiar existe justamente para
 * que a tabela NÃO role de lado -- e um limiar sete pixels curto devolve a
 * faixa morta que ele veio matar.
 */
export const LARGURA_MINIMA_DA_TABELA = {
  processos: 1075,
  lancamentos: 1039,
  documentos: 999,
  aFaturar: 989,
  historico: 974,
  clientes: 896,
  faturas: 804,
  atendimentos: 797,
  /* 🔴 As TRÊS seções do catálogo do Financeiro dividem o mesmo número, e é
     a única exceção à regra de "um por lista". Elas são a mesma tela: a
     pessoa troca de pílula sem sair dela, e com um limiar cada uma o iPad
     mini mostrava Contas em itens e as outras duas em tabela -- a tela
     mudava de forma ao trocar de pílula. 775 é o maior dos três, o único
     medido por encaixe (Contas), e os outros dois o seguem. Categorias
     caberia até 421 e Centros até 232; virar item antes do necessário não
     custa nada, e a aba virando junta vale. */
  contas: 775,
  categorias: 775,
  centros: 775,
  naoCobradas: 725,
  membros: 691,
  emissaoDeFatura: 642,
  previaDaImportacao: 631,
  inscricoes: 525,
} as const;

/** Até onde o CONTEÚDO de um item de lista cresce.
 *
 * 🔴 **O item foi desenhado para 390px, e agora ele aparece em 675.** Desde
 * que cada lista ganhou o seu próprio limiar, um iPad mini em pé mostra itens
 * onde antes mostrava tabela -- e esticado ao dobro o item respira demais: o
 * nome fica na borda esquerda e "0 processos" na direita, com 400px de nada
 * entre os dois. Não é defeito de rolagem, e a régua do mobile não pega: é o
 * `space-between` cumprindo ordens numa largura para a qual ninguém o pensou.
 *
 * ⚠️ **520px é 60 caracteres**, a régua tipográfica de sempre -- medida nesta
 * fonte, com identificadores reais do banco local: 7px por caractere em
 * média. O nome mais longo que existe lá (91 caracteres, 640px) quebra em
 * duas linhas, que é menos do que as três em que ele já quebra no celular.
 *
 * ⚠️ Teto, não largura: abaixo disso o item ocupa o que tem, e no celular
 * este número nunca entra em jogo.
 */
export const LARGURA_MAXIMA_DO_ITEM = "520px";
