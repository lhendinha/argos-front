import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderComRota } from "../../../test/queryTestUtils";
import ItemMenu from "./index";

const HISTORICO = { caminho: "/historico", rotulo: "Histórico", icone: "Historico" };

describe("o contador do item do menu", () => {
  it("🔴 mostra o número EXATO, com milhar -- sem o teto do sino", () => {
    renderComRota(<ItemMenu item={HISTORICO} contador={1234} />);
    expect(document.querySelector("[data-contador]")?.textContent).toBe("1.234");
    expect(screen.getByRole("link", { name: "Histórico, 1.234 envios não lidos" })).toBeInTheDocument();
  });

  it("a frase concorda com um só", () => {
    renderComRota(<ItemMenu item={HISTORICO} contador={1} />);
    expect(screen.getByRole("link", { name: "Histórico, 1 envio não lido" })).toBeInTheDocument();
  });

  it.each([
    ["zero", 0],
    ["ausente", undefined],
  ])("PAR NEGATIVO: com %s, sem pílula e com o nome de sempre", (_caso, contador) => {
    renderComRota(<ItemMenu item={HISTORICO} contador={contador} />);
    expect(document.querySelector("[data-contador]")).toBeNull();
    expect(screen.getByRole("link", { name: "Histórico" })).toBeInTheDocument();
  });
});
