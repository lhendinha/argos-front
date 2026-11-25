import { useAgoraEmBrasilia } from "../../hooks/useAgoraEmBrasilia";
import { formatarData, diasAte } from "../../utils";
import { estaAtrasada } from "../../utils/horaDaTarefa";
import Etiqueta from "../Etiqueta";
import type { EtiquetaDePrazoProps } from "./types";

/** O prazo de uma tarefa como etiqueta (`.due-tag` do artifact).
 *
 * Perto da data, escreve por extenso ("Hoje", "Amanhã", "Ontem") em vez da
 * data: é assim que se fala de prazo, e a data crua exige o leitor calcular
 * a distância sozinho. Longe, a data serve melhor.
 */
export default function EtiquetaDePrazo({ data, concluida, hora }: EtiquetaDePrazoProps) {
  const dias = diasAte(data);
  /* 🔴 A mesma regra da lista "Atrasadas" e da home (`estaAtrasada`), pelo relógio de Brasília que avança a cada
     minuto: com hora, fica vermelha no mesmo dia, quando a hora passa. */
  const agora = useAgoraEmBrasilia();
  const atrasada = estaAtrasada(data, hora, agora) && !concluida;
  const hoje = data === agora.dia && !atrasada;

  const texto =
    dias === 0 ? "Hoje" : dias === 1 ? "Amanhã" : dias === -1 ? "Ontem" : formatarData(data);

  const cores = atrasada
    ? { bg: "status.bad.bg", color: "status.bad.text" }
    : hoje
      /* `warn.text` pelo mesmo motivo do `bad.text` na linha acima -- a
         etiqueta é 11px/800, e a cor cheia sobre o tint dá 3,00:1. Esta
         linha ficou pra trás quando a de cima foi corrigida: porta irmã
         aberta no mesmo ternário. */
      ? { bg: "status.warn.bg", color: "status.warn.text" }
      : { bg: "border.subtle", color: "fg.muted" };

  return <Etiqueta cores={cores}>{hora ? `${texto} ${hora}` : texto}</Etiqueta>;
}
