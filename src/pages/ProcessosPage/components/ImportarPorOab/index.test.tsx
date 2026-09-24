import { act, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  listarMembrosDoSubgrupo: vi.fn().mockResolvedValue({ membros: [] }),
  buscarProcessosPorOab: vi.fn(),
  importarProcessos: vi.fn(),
  lerBusca: vi.fn(),
}));
/* ⚠️ O `ApiError` de verdade: a espera classifica o erro por ele. */
vi.mock("../../../../services/api", async (original) => ({ ...(await original<object>()), ...api }));

import { LIMIAR_SEM_CONTATO_MS, MENSAGEM_SUBSTITUIDA, PREFIXO_DA_BUSCA_GUARDADA } from "../../../../constants";
import { renderComProviders } from "../../../../test/queryTestUtils";
import ImportarPorOab from "./index";

const CIVEL = { subgrupo_id: "s-civel", nome: "Cível" };

describe("ImportarPorOab", () => {
  it("🔴 a lista de subgrupos chegando DEPOIS de abrir: vale o primeiro, e não o vazio", () => {
    /* O defeito visto no Chrome: o `useState(subgrupos[0])` congelava o vazio, e a
       busca ia para `/subgrupos//...` -- "Not Found" na tela. */
    let chegar: (lista: (typeof CIVEL)[]) => void = () => {};
    function Casca() {
      const [lista, setLista] = useState<(typeof CIVEL)[]>([]);
      chegar = setLista;
      return <ImportarPorOab subgrupos={lista} onFechar={() => {}} onImportou={() => {}} />;
    }
    renderComProviders(<Casca />);
    expect(screen.queryByText("Cível")).toBeNull();

    act(() => chegar([CIVEL]));

    expect(screen.getByText("Cível")).toBeTruthy();
  });
});

describe("a busca que terminou em erro", () => {
  function comBuscaGuardadaQueFalhou(erro: string) {
    sessionStorage.clear();
    sessionStorage.setItem(PREFIXO_DA_BUSCA_GUARDADA + CIVEL.subgrupo_id, "t-1");
    api.lerBusca.mockResolvedValue({ trabalho_id: "t-1", estado: "falhou", erro });
    renderComProviders(<ImportarPorOab subgrupos={[CIVEL]} onFechar={() => {}} onImportou={() => {}} />);
  }

  it("a SUBSTITUÍDA por outra da mesma OAB diz o que houve, e não que falhou", async () => {
    comBuscaGuardadaQueFalhou(MENSAGEM_SUBSTITUIDA);
    await waitFor(() => expect(screen.getByText("Busca substituída")).toBeTruthy());
    expect(screen.getByText(/Você começou outra busca desta OAB/)).toBeTruthy();
    expect(screen.queryByText("Não deu para concluir")).toBeNull();
  });

  it("o par: outro erro continua sendo \"Não deu para concluir\", com a mensagem do servidor", async () => {
    comBuscaGuardadaQueFalhou("O PJe está limitando");
    await waitFor(() => expect(screen.getByText("Não deu para concluir")).toBeTruthy());
    expect(screen.getByText("O PJe está limitando")).toBeTruthy();
    expect(screen.queryByText("Busca substituída")).toBeNull();
  });
});

describe("⚠️ sem contato com o servidor durante a busca", () => {
  it("avisa depois do limiar, sem desistir, e o aviso some quando o servidor volta", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      sessionStorage.clear();
      sessionStorage.setItem(PREFIXO_DA_BUSCA_GUARDADA + CIVEL.subgrupo_id, "t-1");
      api.lerBusca.mockReset();
      api.lerBusca.mockRejectedValue(new TypeError("Failed to fetch"));
      renderComProviders(<ImportarPorOab subgrupos={[CIVEL]} onFechar={() => {}} onImportou={() => {}} />);

      await act(async () => vi.advanceTimersByTimeAsync(LIMIAR_SEM_CONTATO_MS + 5000));
      expect(screen.getByText("Sem contato com o servidor")).toBeTruthy();
      expect(screen.queryByText("Não deu para concluir")).toBeNull();

      api.lerBusca.mockResolvedValue({ trabalho_id: "t-1", estado: "na_fila" });
      await act(async () => vi.advanceTimersByTimeAsync(5000));
      expect(screen.queryByText("Sem contato com o servidor")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
