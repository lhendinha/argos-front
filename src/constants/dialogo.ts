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

/** Abaixo desta altura VISÍVEL, o rodapé da folha deixa de ficar preso.
 *
 * 🔴 Medido com teclado de software real: sobram 213px no Android pequeno em
 * pé, 270px no iPhone SE, e **51px** no iPhone grande deitado. Nos dois
 * primeiros o rodapé preso cabe e é o que faz o botão de concluir existir
 * enquanto se digita. Nos 51px não cabe nem o cabeçalho -- e um rodapé
 * preso ali cobriria justamente o campo que a pessoa está preenchendo, que
 * é pior do que estar fora da tela. Abaixo do piso ele volta a rolar com o
 * conteúdo.
 */
export const PISO_PARA_RODAPE_PRESO = 180;
