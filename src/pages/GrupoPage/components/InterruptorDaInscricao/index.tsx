import { Switch } from "@chakra-ui/react";

import type { InterruptorDaInscricaoProps } from "./types";

/** O interruptor de importação automática de uma inscrição da OAB.
 *
 * 🔴 **Existe porque a segunda cópia nasceu.** Ele morava dentro de
 * `LinhaDaInscricao`, e ao escrever `ItemDaInscricao` eu o copiei inteiro --
 * trinta linhas com três comentários que explicam defeitos já pagos. Duas
 * cópias de um controle cujo NOME ACESSÍVEL depende de dois ids é o lugar
 * onde a acessibilidade volta a quebrar calada.
 *
 * 🔴 **Aponta para QUEM DESENHA o número, e não redesenha o número.** Ao
 * extrair este componente eu primeiro apontei o `aria-labelledby` para o
 * próprio `Switch.Root`, cujo texto é "Ligada" -- o nome virava "Ligada
 * Ligada". A segunda tentativa foi desenhar o número escondido aqui dentro,
 * e aí o mesmo texto passou a existir duas vezes na árvore: os testes
 * acharam dois "100000/MG". Quem sabe o número é quem o mostra.
 *
 * 🔴 **Os dois ids existem para o nome acessível, e a razão foi medida:** com
 * `Switch.Label` presente, o Chakra emite `aria-labelledby` apontando para
 * ele -- e `aria-labelledby` VENCE `aria-label`. O `aria-label` que havia
 * antes era ignorado em silêncio, e as 50 linhas ficavam com interruptores
 * todos chamados "Desligada". Apontar para os dois devolve "263/MG Ligada":
 * identifica a linha e diz o estado. E `Switch.Label` continua existindo,
 * então tocar na palavra ainda alterna.
 *
 * 🔴 **Ligar ABRE o modal em vez de ligar.** Sem destino guardado o servidor
 * devolveria 400 -- e com destino guardado ele não existe, porque desligar
 * zera. Por isso são dois callbacks e não um.
 *
 * ⚠️ **Sem `role="switch"`** -- ver `InterruptorDaImportacao`: o Chakra v3 não
 * emite `aria-checked`, e trocar o papel deixaria o estado DESCONHECIDO.
 *
 * ⚠️ A cor da marca é explícita: o Chakra v3 pinta o trilho ligado de PRETO
 * por padrão.
 */
export default function InterruptorDaInscricao({
  inscricao,
  idDoRotulo,
  ligada,
  desabilitado,
  onLigar,
  onDesligar,
}: InterruptorDaInscricaoProps) {
  const idDoEstado = `estado-${inscricao}`;

  return (
    <Switch.Root
      checked={ligada}
      onCheckedChange={() => (ligada ? onDesligar() : onLigar())}
      disabled={desabilitado}
    >
      <Switch.HiddenInput aria-labelledby={`${idDoRotulo} ${idDoEstado}`} />
      <Switch.Control _checked={{ bg: "brand" }}>
        <Switch.Thumb />
      </Switch.Control>
      {/* 🔴 A palavra ao lado, e não só o interruptor: cor e posição sozinhas
          não contam o estado a quem não as distingue -- a mesma régua de
          "(Arquivada)" em `LinhaDeOpcao`. Desligada em `fg.subtle` porque é o
          estado neutro; ligada herda a cor do texto. */}
      <Switch.Label id={idDoEstado} fontSize="12.5px" color={ligada ? undefined : "fg.subtle"}>
        {ligada ? "Ligada" : "Desligada"}
      </Switch.Label>
    </Switch.Root>
  );
}
