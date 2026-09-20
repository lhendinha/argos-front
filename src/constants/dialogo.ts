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
