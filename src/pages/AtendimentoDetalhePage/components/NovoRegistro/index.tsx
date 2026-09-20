import { Flex, Textarea } from "@chakra-ui/react";
import { useState } from "react";

import { Avatar, Botao, IconeEnviar } from "../../../../components";
import { getApelido, getEmail } from "../../../../services";
import type { NovoRegistroProps } from "./types";

/** O campo de escrever no fim da linha do tempo (`.tl-new` do artifact).
 *
 * Limpa sozinho só quando o envio DÁ CERTO -- quem escreveu três parágrafos
 * e viu a rede cair não pode perdê-los. Por isso o texto só é descartado no
 * callback de sucesso, e não ao clicar.
 */
export default function NovoRegistro({ enviando, onEnviar }: NovoRegistroProps) {
  const [texto, setTexto] = useState("");

  const vazio = texto.trim() === "";

  return (
    /* 🔴 **O botão desce quando a caixa fica estreita demais para escrever.**
       Medido em 375px: avatar, campo e botão na mesma fileira deixavam o
       campo com 174px -- cerca de 21 caracteres por linha, contra 132 no
       desktop. Não dá para redigir um registro de atendimento em 21
       caracteres.

       ⚠️ Sem ponto de virada: o `wrap` com `minW` no campo é que decide. Onde
       os três cabem, nada muda -- em 1440 a fileira segue igual. */
    <Flex gap="12px" pt="14px" align="flex-start" wrap="wrap">
      {/* O avatar de quem está escrevendo, como no artifact -- alinha a
          coluna com a das entradas acima. */}
      <Avatar nome={getApelido() || getEmail() || ""} tamanho="pequeno" />
      <Textarea
        /* O piso é o que empurra o botão para baixo: abaixo de 260px de
           campo a fileira não fecha, e ele desce. */
        flex="1 1 260px"
        minW="260px"
        minH="64px"
        resize="vertical"
        /* O recipe do Chakra dá 9px 12px e raio `sm` ao campo; o artifact
           quer 10px 12px e raio `md` neste (`.tl-new textarea`). Explícito
           porque o recipe vence o padrão herdado. */
        p="10px 12px"
        borderRadius="md"
        aria-label="Novo registro do atendimento"
        placeholder="Adicionar novo registro..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      {/* Só o ícone, como no artifact -- por isso o `aria-label` e o
          `title` não são enfeite: são o único nome que o botão tem, pra
          leitor de tela e pra quem passa o mouse sem reconhecer o desenho.
          O estado de envio vira o texto "Enviando…", que aí aparece. */}
      <Botao
        type="button"
        alignSelf="flex-end"
        /* Colado à direita quando desce sozinho para a segunda linha; na
           fileira cheia não há folga, então isto não faz nada lá. */
        ml="auto"
        aria-label="Adicionar registro"
        title="Adicionar registro"
        disabled={vazio || enviando}
        onClick={async () => {
          if (vazio || enviando) return;
          try {
            await onEnviar(texto.trim());
            setTexto("");
          } catch {
            /* Fica tudo como está: o erro já vira toast lá em cima, e
               limpar aqui apagaria o que a pessoa acabou de escrever. */
          }
        }}
      >
        {enviando ? "Enviando…" : <IconeEnviar />}
      </Botao>
    </Flex>
  );
}
