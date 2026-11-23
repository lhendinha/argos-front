import { useRef, useState } from "react";

import { paraIso } from "../../../utils/calendario";

/** O dia que o cartão lateral do mês mostra, e o clique que o troca.
 *
 * 🔴 O dia sai SEMPRE da grade à vista: o clicado, se for do mês; senão hoje,
 * se hoje for do mês; senão o dia 1. É o que dispensa consulta própria -- a
 * da visão já trouxe o dia. Um dia fora da grade seria lido de uma lista que
 * não o tem, e o cartão diria "Nenhuma tarefa" havendo tarefa.
 *
 * ➡️ `AgendaPage/index.test.tsx`, bloco "cartão do dia".
 */
export function useDiaDoCartao(
  dataVisivel: Date,
  isoDeHoje: string,
  irParaData: (data: Date) => void,
) {
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const cartaoRef = useRef<HTMLDivElement>(null);
  const mesVisivel = paraIso(dataVisivel).slice(0, 7);
  const iso = escolhido?.startsWith(mesVisivel)
    ? escolhido
    : isoDeHoje.startsWith(mesVisivel)
      ? isoDeHoje
      : `${mesVisivel}-01`;

  function selecionar(novo: string) {
    setEscolhido(novo);
    /* Dia cinza da grade é de outro mês: a grade vai junto. */
    if (!novo.startsWith(mesVisivel)) irParaData(new Date(`${novo}T00:00:00`));
    /* Na coluna única o cartão fica EMBAIXO da grade; sem rolar, o clique
       não teria efeito visível. ⚠️ `start`, não `nearest`: num dia cheio o
       cartão passa da altura da tela, e `nearest` parava no FIM dele,
       escondendo o título que diz qual dia é. Ao lado da grade não rola. */
    requestAnimationFrame(() => {
      const cartao = cartaoRef.current;
      if (cartao && cartao.getBoundingClientRect().top > window.innerHeight / 2) {
        cartao.scrollIntoView?.({ block: "start", behavior: "smooth" });
      }
    });
  }

  return { iso, selecionar, esquecer: () => setEscolhido(null), cartaoRef };
}
