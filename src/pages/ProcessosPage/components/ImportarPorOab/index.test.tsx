import { act, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  listarMembrosDoSubgrupo: vi.fn().mockResolvedValue({ membros: [] }),
  buscarProcessosPorOab: vi.fn(),
  importarProcessos: vi.fn(),
  lerBusca: vi.fn(),
  lerGravacao: vi.fn(),
}));
/* ⚠️ O `ApiError` de verdade: a espera classifica o erro por ele. */
vi.mock("../../../../services/api", async (original) => ({ ...(await original<object>()), ...api }));

import { LIMIAR_SEM_CONTATO_MS, MENSAGEM_SUBSTITUIDA } from "../../../../constants";
import { guardarImportacao } from "../../../../utils/importacaoGuardada";
import { renderComProviders } from "../../../../test/queryTestUtils";
import ImportarPorOab from "./index";

const CIVEL = { subgrupo_id: "s-civel", nome: "Cível" };
const CRIMINAL = { subgrupo_id: "s-criminal", nome: "Criminal" };
const EU = "eu@escritorio.com";

/** A tela lê o e-mail de quem entrou -- a importação guardada é dela. */
function comoEu() {
  localStorage.setItem("pje-monitor-email", EU);
}

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
    comoEu();
    guardarImportacao({ email: EU, subgrupoId: CIVEL.subgrupo_id, busca: "t-1" });
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
      comoEu();
      guardarImportacao({ email: EU, subgrupoId: CIVEL.subgrupo_id, busca: "t-1" });
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

describe("🔴 a importação em curso trava o subgrupo (item 11)", () => {
  function comImportacaoGuardada(subgrupoId: string, extra: { gravacao?: string } = {}) {
    sessionStorage.clear();
    comoEu();
    guardarImportacao({ email: EU, subgrupoId, busca: "t-1", ...extra });
  }

  it("durante a busca, o seletor mostra o subgrupo DELA e fica desabilitado", async () => {
    comImportacaoGuardada(CRIMINAL.subgrupo_id);
    api.lerBusca.mockReset();
    api.lerBusca.mockResolvedValue({ trabalho_id: "t-1", estado: "na_fila" });
    renderComProviders(<ImportarPorOab subgrupos={[CIVEL, CRIMINAL]} onFechar={() => {}} onImportou={() => {}} />);

    await waitFor(() => expect(api.lerBusca).toHaveBeenCalledWith(CRIMINAL.subgrupo_id, "t-1"));
    expect(screen.getByText("Criminal")).toBeTruthy();
    expect((document.getElementById("subgrupo-importacao") as HTMLInputElement).disabled).toBe(true);
  });

  it("o par: sem importação, o seletor fica livre", () => {
    sessionStorage.clear();
    comoEu();
    renderComProviders(<ImportarPorOab subgrupos={[CIVEL, CRIMINAL]} onFechar={() => {}} onImportou={() => {}} />);
    expect((document.getElementById("subgrupo-importacao") as HTMLInputElement).disabled).toBe(false);
  });

  it("⚠️ o subgrupo da importação foi apagado: avisa e destrava", async () => {
    comImportacaoGuardada("s-apagado");
    api.lerBusca.mockReset();
    api.lerBusca.mockResolvedValue({ trabalho_id: "t-1", estado: "na_fila" });
    renderComProviders(<ImportarPorOab subgrupos={[CIVEL]} onFechar={() => {}} onImportou={() => {}} />);

    await waitFor(() => expect(screen.getByText(/O subgrupo desta importação não existe mais/)).toBeTruthy());
    expect((document.getElementById("subgrupo-importacao") as HTMLInputElement).disabled).toBe(false);
    expect(sessionStorage.length).toBe(0);
  });

  it("a tela recarregada no meio da GRAVAÇÃO volta a ela, com a barra", async () => {
    comImportacaoGuardada(CIVEL.subgrupo_id, { gravacao: "g-1" });
    api.lerGravacao.mockResolvedValue({ trabalho_id: "g-1", estado: "na_fila" });
    renderComProviders(<ImportarPorOab subgrupos={[CIVEL]} onFechar={() => {}} onImportou={() => {}} />);

    expect(screen.getByText("Gravando os processos escolhidos")).toBeTruthy();
    await waitFor(() => expect(api.lerGravacao).toHaveBeenCalledWith(CIVEL.subgrupo_id, "g-1"));
  });
});

describe("o fim da importação", () => {
  it("\"Ver os processos\" encerra a importação da aba -- a página recarregada não a reabre", async () => {
    sessionStorage.clear();
    comoEu();
    guardarImportacao({ email: EU, subgrupoId: CIVEL.subgrupo_id, busca: "t-1", gravacao: "g-1" });
    api.lerGravacao.mockResolvedValue({ trabalho_id: "g-1", estado: "concluido", cadastrados: 2, ja_existiam: 0, falharam: [] });
    const onFechar = vi.fn();
    renderComProviders(<ImportarPorOab subgrupos={[CIVEL]} onFechar={onFechar} onImportou={() => {}} />);

    const ver = await screen.findByRole("button", { name: "Ver os processos" });
    act(() => ver.click());

    expect(onFechar).toHaveBeenCalled();
    expect(sessionStorage.length).toBe(0);
  });
});
