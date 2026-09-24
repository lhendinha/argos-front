import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderComProviders } from "../../../../test/queryTestUtils";
import AvisoDaBusca from "./index";

describe("AvisoDaBusca", () => {
  it("antes do primeiro processo, diz que eles vão aparecer", () => {
    renderComProviders(<AvisoDaBusca encontrados={0} />);
    expect(screen.getByText("os processos aparecem aqui conforme o tribunal responde")).toBeTruthy();
  });

  it("conta no singular", () => {
    renderComProviders(<AvisoDaBusca encontrados={1} />);
    expect(screen.getByText("1 processo encontrado até agora")).toBeTruthy();
  });

  it("conta no plural", () => {
    renderComProviders(<AvisoDaBusca encontrados={120} />);
    expect(screen.getByText("120 processos encontrados até agora")).toBeTruthy();
  });
});
