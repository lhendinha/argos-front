import { describe, expect, it } from "vitest";

import { agoraEmBrasilia, avisoEmUnidade, compararPelaAgenda, estaAtrasada } from "./horaDaTarefa";

const AGORA = { dia: "2026-12-01", hora: "09:00" };

describe("estaAtrasada -- os mesmos casos de `tests/test_horario_da_tarefa.py` da API", () => {
  it("às 09:00 a tarefa das 09:00 ainda não está atrasada; às 09:01, está", () => {
    expect(estaAtrasada("2026-12-01", "09:00", AGORA)).toBe(false);
    expect(estaAtrasada("2026-12-01", "09:00", { ...AGORA, hora: "09:01" })).toBe(true);
  });

  it("sem hora, só no dia seguinte", () => {
    expect(estaAtrasada("2026-12-01", null, { ...AGORA, hora: "23:59" })).toBe(false);
    expect(estaAtrasada("2026-11-30", null, AGORA)).toBe(true);
  });

  it("amanhã com hora já passada no relógio não está atrasada", () => {
    expect(estaAtrasada("2026-12-02", "08:00", AGORA)).toBe(false);
  });
});

describe("agoraEmBrasilia", () => {
  it("usa Brasília, não UTC: 02:30 UTC ainda é o dia anterior lá", () => {
    expect(agoraEmBrasilia(new Date("2026-12-02T02:30:00Z"))).toEqual({ dia: "2026-12-01", hora: "23:30" });
  });
});

describe("avisoEmUnidade", () => {
  it("escolhe a maior unidade exata e nunca arredonda", () => {
    expect(avisoEmUnidade(1440)).toEqual({ numero: 1, unidade: "1440" });
    expect(avisoEmUnidade(120)).toEqual({ numero: 2, unidade: "60" });
    expect(avisoEmUnidade(90)).toEqual({ numero: 90, unidade: "1" });
    expect(avisoEmUnidade(2880 + 60)).toEqual({ numero: 49, unidade: "60" });
  });
});

describe("compararPelaAgenda", () => {
  it("pela data, e no mesmo dia sem hora antes das com hora", () => {
    const lista = [
      { data: "2026-12-02", hora: null },
      { data: "2026-12-01", hora: "10:00" },
      { data: "2026-12-01", hora: null },
      { data: "2026-12-01", hora: "08:00" },
    ].sort(compararPelaAgenda);
    expect(lista.map((t) => `${t.data} ${t.hora ?? "-"}`)).toEqual([
      "2026-12-01 -", "2026-12-01 08:00", "2026-12-01 10:00", "2026-12-02 -",
    ]);
  });
});

describe("nomeComHora", () => {
  it("põe a hora quando há, e só o título quando não há", async () => {
    const { nomeComHora } = await import("./horaDaTarefa");
    expect(nomeComHora({ titulo: "Audiência", hora: "14:30" })).toBe("Audiência, às 14:30");
    expect(nomeComHora({ titulo: "Audiência", hora: null })).toBe("Audiência");
  });
});
