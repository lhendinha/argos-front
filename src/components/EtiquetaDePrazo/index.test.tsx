import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* A cor sai do `cores` que a etiqueta recebe: o jsdom não calcula estilo, então o teste lê o pedido. */
vi.mock("../Etiqueta", () => ({
  default: ({ cores, children }: { cores: { bg: string }; children: string }) => (
    <span data-cor={cores.bg}>{children}</span>
  ),
}));

import EtiquetaDePrazo from "./index";

beforeEach(() => {
  vi.useFakeTimers();
  /* 08:59:30 em Brasília. */
  vi.setSystemTime(new Date("2026-12-01T11:59:30Z"));
});
afterEach(() => vi.useRealTimers());

describe("EtiquetaDePrazo com hora", () => {
  it("🔴 fica vermelha quando a hora passa, sem recarregar a tela", () => {
    render(<EtiquetaDePrazo data="2026-12-01" hora="09:00" />);
    expect(screen.getByText("Hoje 09:00")).toHaveAttribute("data-cor", "status.warn.bg");

    act(() => vi.advanceTimersByTime(2 * 60_000));
    expect(screen.getByText("Hoje 09:00")).toHaveAttribute("data-cor", "status.bad.bg");
  });

  it("sem hora, hoje continua amarela o dia inteiro", () => {
    vi.setSystemTime(new Date("2026-12-02T02:30:00Z")); // 23:30 em Brasília
    render(<EtiquetaDePrazo data="2026-12-01" />);
    expect(screen.getByText("Hoje")).toHaveAttribute("data-cor", "status.warn.bg");
  });

  it("concluída não fica vermelha, mesmo com a hora passada", () => {
    vi.setSystemTime(new Date("2026-12-01T15:00:00Z"));
    render(<EtiquetaDePrazo data="2026-12-01" hora="09:00" concluida />);
    expect(screen.getByText("Hoje 09:00")).not.toHaveAttribute("data-cor", "status.bad.bg");
  });
});
