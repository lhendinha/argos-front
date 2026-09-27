/** O rótulo do "verificado até": o dia do servidor, o atraso, e o histórico em carga. */
import { describe, expect, it } from "vitest";

import { rotuloDaVerificacao } from "./verificacao";

describe("rotuloDaVerificacao", () => {
  it("mostra o dia que o servidor mandou, em dd/mm", () => {
    expect(rotuloDaVerificacao({ verificado_ate: "2026-09-26", verificacao_atrasada: false })).toEqual({
      texto: "verificado até 26/09",
      atrasada: false,
    });
  });

  it("o atraso é o do servidor -- e o par: sem ele, não há atraso", () => {
    expect(rotuloDaVerificacao({ verificado_ate: "2026-09-20", verificacao_atrasada: true }).atrasada).toBe(true);
    expect(rotuloDaVerificacao({ verificado_ate: "2026-09-20" }).atrasada).toBe(false);
  });

  it("o dia é recortado, nunca convertido: 01/10 não vira 30/09 pelo fuso", () => {
    expect(rotuloDaVerificacao({ verificado_ate: "2026-10-01" }).texto).toBe("verificado até 01/10");
  });

  it("sem dia, ainda não verificado -- e pode estar atrasado (o cadastro é antigo)", () => {
    expect(rotuloDaVerificacao({ verificado_ate: null, verificacao_atrasada: true })).toEqual({
      texto: "ainda não verificado",
      atrasada: true,
    });
  });

  it("o histórico em carga vence, sem dia nem atraso", () => {
    expect(
      rotuloDaVerificacao({ historico_em_carga: true, verificado_ate: "2026-09-26", verificacao_atrasada: true }),
    ).toEqual({ texto: "histórico em carga", atrasada: false });
  });
});
