import { describe, expect, it } from "vitest";

import { contarFormatado, formatarQuantidade } from "./numero";

describe("a quantidade com separador de milhar", () => {
  it.each([
    [0, "0"],
    [7, "7"],
    [999, "999"],
    [1234, "1.234"],
    [1234567, "1.234.567"],
  ])("%i vira %s", (quantidade, esperado) => {
    expect(formatarQuantidade(quantidade)).toBe(esperado);
  });

  it("a palavra concorda com a quantidade, e o número vem formatado", () => {
    expect(contarFormatado(1, "envio", "envios")).toBe("1 envio");
    expect(contarFormatado(0, "envio", "envios")).toBe("0 envios");
    expect(contarFormatado(1234, "não lido", "não lidos")).toBe("1.234 não lidos");
  });
});
