import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderComProviders } from "../../../../test/queryTestUtils";
import BuscaEmAndamento from ".";

const ACHADO = {
  numero_processo: "50062528720248210001",
  apelido: "Execução Fiscal",
  tribunal: "TJRS",
  comunicacoes: 3,
  ja_existe: false,
  noutros_subgrupos: [],
  em_outro_subgrupo: false,
  removido_antes: false,
};

describe("BuscaEmAndamento", () => {
  it("antes da primeira página diz que está buscando, sem lista", () => {
    renderComProviders(<BuscaEmAndamento processos={[]} />);
    expect(screen.getByText("Buscando no PJe…")).toBeTruthy();
    expect(screen.queryByText(/encontrado/)).toBeNull();
  });

  it("mostra quantos já vieram e cada processo com o número mascarado", () => {
    renderComProviders(<BuscaEmAndamento processos={[ACHADO, { ...ACHADO, numero_processo: "50000011220248210001", apelido: "Usucapião" }]} />);
    expect(screen.getByText("2 processos encontrados até agora")).toBeTruthy();
    expect(screen.getByText("Execução Fiscal")).toBeTruthy();
    expect(screen.getByText("5006252-87.2024.8.21.0001")).toBeTruthy();
  });

  it("concorda no singular", () => {
    renderComProviders(<BuscaEmAndamento processos={[ACHADO]} />);
    expect(screen.getByText("1 processo encontrado até agora")).toBeTruthy();
  });
});
