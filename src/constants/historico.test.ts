import { describe, expect, it } from "vitest";

import { LEITURA_LIDOS, LEITURA_NAO_LIDOS, LEITURAS_DO_HISTORICO } from "./historico";

describe("o filtro de leitura do histórico", () => {
  /**
   * 🔴 A dupla é só o que FILTRA. "Lidos e não lidos" é a ausência de filtro,
   * como no tipo de envio: um terceiro valor -- "todos", ou o vazio dentro da
   * lista -- viraria um filtro que a API não conhece.
   *
   * ➡️ O rótulo de cada opção mora na página (seção 0c do `CONTEXT.md`).
   */
  it("tem só os dois valores que filtram, distintos e sem o vazio", () => {
    expect(LEITURAS_DO_HISTORICO).toHaveLength(2);
    expect(new Set(LEITURAS_DO_HISTORICO).size).toBe(2);
    expect(LEITURAS_DO_HISTORICO.every((v) => v.trim() !== "")).toBe(true);
    expect(LEITURAS_DO_HISTORICO).not.toContain("todos");
    expect([LEITURA_NAO_LIDOS, LEITURA_LIDOS]).toEqual([...LEITURAS_DO_HISTORICO]);
  });
});
