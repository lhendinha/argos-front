import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderComProviders } from "../../test/queryTestUtils";
import EtiquetasDeSubgrupo from "./index";

const TRES = ["Cível", "Trabalhista", "Ângela e Associados"];

describe("EtiquetasDeSubgrupo", () => {
  it("sem nenhum, mostra o travessão -- e não a célula vazia", () => {
    /* Numa coluna com nome, vazio se lê como dado que faltou, não como
       "nada a declarar". */
    renderComProviders(<EtiquetasDeSubgrupo nomes={[]} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it.each([[["Cível"]], [["Cível", "Trabalhista"]]])(
    "até DOIS, mostra os nomes: %s",
    (nomes) => {
      renderComProviders(<EtiquetasDeSubgrupo nomes={nomes} />);

      for (const nome of nomes) expect(screen.getByText(nome)).toBeInTheDocument();
      expect(screen.queryByText(/subgrupos$/)).not.toBeInTheDocument();
    },
  );

  it("🔴 de TRÊS em diante, mostra um BOTÃO com a contagem no lugar dos nomes", () => {
    /* O motivo é a ALTURA DA LINHA: vinte etiquetas quebram em quatro
       fileiras, a linha da tabela cresce, as vizinhas não, e as colunas
       descolam do que descrevem.

       ⚠️ A segunda metade é o par negativo: sem ela, uma implementação que
       mostrasse a contagem E os nomes passaria. */
    renderComProviders(<EtiquetasDeSubgrupo nomes={TRES} />);

    /* 🔴 O resumo deixou de ser mudo: ele ABRE. Era `<span>3 subgrupos</span>`
       e o `title` devolvia a lista -- ao PONTEIRO. No toque não há ponteiro,
       e o detalhe do envio também não lista subgrupo: a contagem era
       informação perdida, não resumida. */
    expect(screen.getByRole("button", { name: "Ver os 3 subgrupos" })).toBeInTheDocument();
    for (const nome of TRES) expect(screen.queryByText(nome)).not.toBeInTheDocument();
  });

  it("⚠️ o `title` guarda a lista INTEIRA -- o que a pílula resume, o ponteiro devolve", () => {
    /* ⚠️ Ele NÃO saiu quando o botão entrou: são duas saídas para dois
       apontadores. Eu tinha removido o `title` ao pôr o popover, contra o
       que o próprio comentário do componente dizia -- foi este teste que
       pegou. */
    renderComProviders(<EtiquetasDeSubgrupo nomes={TRES} />);

    expect(screen.getByTitle(TRES.join(", "))).toBeInTheDocument();
  });

  it("🔴 o botão abre a lista dos nomes -- a saída que o dedo alcança", async () => {
    const user = userEvent.setup();
    renderComProviders(<EtiquetasDeSubgrupo nomes={TRES} />);

    await user.click(screen.getByRole("button", { name: "Ver os 3 subgrupos" }));

    for (const nome of TRES) expect(await screen.findByText(nome)).toBeInTheDocument();

    /* ⚠️ Fecha antes de terminar. O balão é do zag, que agenda um
       `requestAnimationFrame` ao desmontar; deixado aberto, esse quadro cai
       depois que o ambiente do teste já foi desfeito, e a suíte inteira
       termina com "erro não tratado" -- num arquivo qualquer, não neste. */
    await user.keyboard("{Escape}");
    /* ⚠️ `waitFor`: o `unmountOnExit` só desmonta DEPOIS da saída, então
       logo após a tecla os nomes ainda estão no documento. */
    await waitFor(() => expect(screen.queryByText(TRES[0])).not.toBeInTheDocument());
  });
});
