import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { criarQueryClientDeTeste } from "../test/queryTestUtils";
import { TIPO_LEMBRETE, TIPO_TAREFA_ATRIBUIDA } from "../constants";
import { limparOuvintesDoCanal, publicarNoCanal } from "../utils/canalDeTempoReal";

const mocks = vi.hoisted(() => ({ contarNaoLidosDoHistorico: vi.fn() }));

vi.mock("../services", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services")>()),
  contarNaoLidosDoHistorico: mocks.contarNaoLidosDoHistorico,
}));

import { useNaoLidosDoHistorico } from "./useNaoLidosDoHistorico";

function montar() {
  const client = criarQueryClientDeTeste();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return renderHook(() => useNaoLidosDoHistorico(), { wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.contarNaoLidosDoHistorico.mockResolvedValue({ nao_lidos: 7 });
});

afterEach(() => limparOuvintesDoCanal());

describe("o contador de não lidos do menu", () => {
  it("é o número do servidor -- e zero enquanto ele não responde", async () => {
    mocks.contarNaoLidosDoHistorico.mockReturnValue(new Promise(() => {}));
    const { result } = montar();
    expect(result.current).toBe(0);
  });

  it("devolve o número exato que o servidor contou", async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current).toBe(7));
  });

  it("⚠️ a consulta que falha dá zero, e não derruba o menu", async () => {
    mocks.contarNaoLidosDoHistorico.mockRejectedValue(new Error("rede"));
    const { result } = montar();
    await waitFor(() => expect(mocks.contarNaoLidosDoHistorico).toHaveBeenCalled());
    expect(result.current).toBe(0);
  });

  it("🔴 o aviso de LEMBRETE pelo canal manda buscar de novo", async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current).toBe(7));
    mocks.contarNaoLidosDoHistorico.mockResolvedValue({ nao_lidos: 8 });
    act(() => publicarNoCanal({ tipo: "notificacao", notificacao: { tipo: TIPO_LEMBRETE } as never }));
    await waitFor(() => expect(result.current).toBe(8));
  });

  it.each([
    ["outro tipo de notificação", { tipo: "notificacao", notificacao: { tipo: TIPO_TAREFA_ATRIBUIDA } as never }],
    ["outra mensagem do canal", { tipo: "importacao_progresso" }],
  ])("PAR NEGATIVO: %s não recarrega", async (_caso, mensagem) => {
    const { result } = montar();
    await waitFor(() => expect(result.current).toBe(7));
    act(() => publicarNoCanal(mensagem));
    await new Promise((r) => setTimeout(r, 20));
    expect(mocks.contarNaoLidosDoHistorico).toHaveBeenCalledTimes(1);
  });

  it("desmontado, para de ouvir o canal", async () => {
    const { result, unmount } = montar();
    await waitFor(() => expect(result.current).toBe(7));
    unmount();
    act(() => publicarNoCanal({ tipo: "notificacao", notificacao: { tipo: TIPO_LEMBRETE } as never }));
    await new Promise((r) => setTimeout(r, 20));
    expect(mocks.contarNaoLidosDoHistorico).toHaveBeenCalledTimes(1);
  });
});
