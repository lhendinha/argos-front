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
 * ⚠️ **Cada número é a largura MÍNIMA medida da tabela dele**, com o banco
 * local cheio: a tabela renderizada num container estreito não encolhe abaixo
 * do conteúdo, então o `scrollWidth` ali é o mínimo. Dado maior que o do
 * banco local ainda pode estourar -- e é para isso que a `Table.ScrollArea`
 * continua existindo. O que estes números tiram é o estouro ESTRUTURAL, que
 * acontecia com qualquer dado.
 *
 * ⚠️ Eles envelhecem com as colunas. Coluna nova pede medida nova, e a régua
 * do mobile acusa quem esquecer.
 */
export const LARGURA_MINIMA_DA_TABELA = {
  processos: 1068,
  lancamentos: 1039,
  documentos: 999,
  aFaturar: 989,
  historico: 974,
  clientes: 896,
  faturas: 804,
  atendimentos: 797,
  contas: 775,
  naoCobradas: 725,
  membros: 691,
  emissaoDeFatura: 642,
  previaDaImportacao: 621,
  inscricoes: 525,
  categorias: 421,
} as const;
