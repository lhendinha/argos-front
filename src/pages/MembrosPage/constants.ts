/** Cabeçalhos da tabela de Membros, na ordem do artifact. A última é a
 * coluna de ações -- sem nome, mas precisa existir pra a contagem de
 * colunas bater com a das linhas. */
/* ⚠️ "Nome completo", e não "Apelido": o modal que esta tabela abre já usa o
   rótulo novo, e a mesma coisa com dois nomes na mesma tela é o defeito que a
   troca do perfil existia para evitar. Atrás continua o campo `apelido`, sem
   migração -- o nome novo vale onde a PESSOA lê. */
export const COLUNAS_MEMBROS = ["Nome completo", "E-mail", "Papel", "Subgrupo"] as const;
export const COLUNA_DE_ACOES = "" as const;

/** Teto das duas colunas de texto livre da tabela de pessoas.
 *
 * 🔴 **Nome de pessoa não pode empurrar a tabela de lado.** A régua do
 * mobile achou ao abrir a aba de Membros pela primeira vez: com um nome
 * longo, a coluna "Nome completo" sozinha ia a 517px dos 947 da tabela, e
 * ela rolava 189px dentro da própria área num celular deitado. As colunas
 * que se varre são papel e subgrupo; o nome, quando não cabe, corta com
 * reticências e continua identificando.
 *
 * ⚠️ 300px é a conta do pior caso medido: as outras quatro colunas somam
 * 430px, e o visível em 832px de janela é 758. Com 300 a tabela fecha em
 * 730 e sobra folga para o e-mail crescer.
 */
export const LARGURA_MAXIMA_DO_NOME = "300px";
