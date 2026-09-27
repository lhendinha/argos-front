/** O "verificado até" na tela: o texto, o "(atrasado)" em amarelo, e a maiúscula do detalhe. */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderComProviders } from "../../test/queryTestUtils";
import VerificacaoDoProcesso from "./index";

describe("VerificacaoDoProcesso", () => {
  it("atrasado aparece à parte, e o par: em dia, não aparece", () => {
    const { unmount } = renderComProviders(
      <VerificacaoDoProcesso processo={{ verificado_ate: "2026-09-20", verificacao_atrasada: true }} />,
    );
    expect(screen.getByText(/verificado até 20\/09/)).toBeInTheDocument();
    expect(screen.getByText("(atrasado)")).toBeInTheDocument();
    unmount();

    renderComProviders(<VerificacaoDoProcesso processo={{ verificado_ate: "2026-09-27", verificacao_atrasada: false }} />);
    expect(screen.getByText(/verificado até 27\/09/)).toBeInTheDocument();
    expect(screen.queryByText("(atrasado)")).not.toBeInTheDocument();
  });

  it("no detalhe abre a frase com maiúscula; na lista, não", () => {
    const { unmount } = renderComProviders(
      <VerificacaoDoProcesso processo={{ verificado_ate: "2026-09-27" }} inicioDeFrase />,
    );
    expect(screen.getByText("Verificado até 27/09")).toBeInTheDocument();
    unmount();
    renderComProviders(<VerificacaoDoProcesso processo={{ verificado_ate: "2026-09-27" }} />);
    expect(screen.getByText("verificado até 27/09")).toBeInTheDocument();
  });
});
