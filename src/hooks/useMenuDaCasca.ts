/** O menu da casca: se cabe fixo, se está aberto, e como alternar.
 *
 * 🔴 **A pergunta é de ESPAÇO, não de aparelho.** `(min-width: 768px) and
 * (min-height: 500px)`: largura para o menu MAIS uma coluna de leitura, e
 * altura para os dez itens em pé. As duas condições saem de medição --
 * medi o iPhone 17 Pro Max deitado em 832x334, que tem largura de sobra e
 * altura nenhuma; uma régua só de largura entregaria o menu fixo bem ali.
 * Pelo mesmo motivo o iPad mini em pé (744px) fica com a gaveta e ganha os
 * 744 inteiros de conteúdo, em vez dos 508 que sobrariam.
 *
 * 🔴 **O estado do desktop é LEMBRADO e o do celular não.** Recolher o menu
 * num monitor é preferência de trabalho e precisa sobreviver ao F5; abrir a
 * gaveta no celular é um gesto para ir a uma tela, e reabri-la sozinha na
 * próxima visita cobriria o conteúdo sem ninguém ter pedido.
 *
 * ⚠️ **Sem `matchMedia`, assume fixo.** O jsdom não o implementa, e é o que
 * mantém os testes que montam a casca vendo a mesma árvore de sempre. O
 * navegador sempre tem; quem cai neste ramo é teste, não gente.
 *
 * ⚠️ `localStorage` dentro de `try`: em aba privativa o acesso lança, e a
 * casca não pode deixar de montar porque uma preferência não pôde ser lida.
 */
import { useCallback, useEffect, useState } from "react";

import type { MenuDaCasca } from "../types/ui";

const CONSULTA = "(min-width: 768px) and (min-height: 500px)";
const LEMBRANCA = "argos-menu-recolhido";

export function useMenuDaCasca(): MenuDaCasca {
  const [fixo, setFixo] = useState(
    () => typeof window.matchMedia !== "function" || window.matchMedia(CONSULTA).matches,
  );
  const [recolhido, setRecolhido] = useState(() => {
    try {
      return localStorage.getItem(LEMBRANCA) === "1";
    } catch {
      return false;
    }
  });
  const [gavetaAberta, setGavetaAberta] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const consulta = window.matchMedia(CONSULTA);
    const responder = (evento: MediaQueryListEvent) => {
      setFixo(evento.matches);
      /* A gaveta fecha ao virar o aparelho: deixá-la aberta faria o menu
         reaparecer por cima do conteúdo numa largura em que ele já é fixo. */
      if (evento.matches) setGavetaAberta(false);
    };
    consulta.addEventListener("change", responder);
    return () => consulta.removeEventListener("change", responder);
  }, []);

  const alternar = useCallback(() => {
    if (fixo) {
      setRecolhido((antes) => {
        try {
          localStorage.setItem(LEMBRANCA, antes ? "0" : "1");
        } catch {
          /* Preferência não guardada vale menos que a casca não montar. */
        }
        return !antes;
      });
      return;
    }
    setGavetaAberta((antes) => !antes);
  }, [fixo]);

  const fechar = useCallback(() => setGavetaAberta(false), []);

  return { fixo, aberto: fixo ? !recolhido : gavetaAberta, alternar, fechar };
}
