import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderComRota } from "../../../test/queryTestUtils";

const mocks = vi.hoisted(() => ({ contarNaoLidosDoHistorico: vi.fn(), papelAtende: vi.fn(() => true) }));

vi.mock("../../../services", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../services")>()),
  contarNaoLidosDoHistorico: mocks.contarNaoLidosDoHistorico,
  papelAtende: mocks.papelAtende,
}));

/* ⚠️ A marca e o botão de suporte leem a sessão, e este teste é do contador: montá-los exigiria o provedor da sessão
   inteiro para nada. */
vi.mock("../BotaoDeSuporte", () => ({ default: () => null }));
vi.mock("../../MarcaArgos", () => ({ default: () => null }));

import MenuLateral from "./index";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.contarNaoLidosDoHistorico.mockResolvedValue({ nao_lidos: 5 });
});

describe("o menu lateral e os não lidos", () => {
  it("🔴 o número vai SÓ no item do Histórico", async () => {
    renderComRota(<MenuLateral />);
    expect(await screen.findByRole("link", { name: "Histórico, 5 envios não lidos" })).toBeInTheDocument();
    expect(document.querySelectorAll("[data-contador]")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Processos" })).toBeInTheDocument();
  });

  it("sem não lidos, o Histórico fica sem pílula", async () => {
    mocks.contarNaoLidosDoHistorico.mockResolvedValue({ nao_lidos: 0 });
    renderComRota(<MenuLateral />);
    await waitFor(() => expect(mocks.contarNaoLidosDoHistorico).toHaveBeenCalled());
    expect(screen.getByRole("link", { name: "Histórico" })).toBeInTheDocument();
    expect(document.querySelector("[data-contador]")).toBeNull();
  });
});
