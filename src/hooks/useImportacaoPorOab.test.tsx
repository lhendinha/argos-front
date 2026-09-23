import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/* ⚠️ `vi.hoisted` porque `vi.mock` é içado para o topo do arquivo: um objeto
 * declarado normalmente ainda não existe quando a fábrica roda. */
const api = vi.hoisted(() => ({
  buscarProcessosPorOab: vi.fn(),
  importarProcessos: vi.fn(),
  lerBusca: vi.fn(),
}));
vi.mock("../services/api", () => api);

import { useImportacaoPorOab } from "./useImportacaoPorOab";
import { limparOuvintesDoCanal, publicarNoCanal } from "../utils/canalDeTempoReal";
import type { MensagemDoCanal } from "../types";

const ACHADO = {
  numero_processo: "50062528720248210001",
  apelido: "Execução Fiscal",
  comunicacoes: 3,
  ja_existe: false,
};

function previa(processos = [ACHADO]) {
  return { id: "abc", total_encontrado: processos.length, atingiu_o_teto: false, processos };
}

beforeEach(() => {
  vi.clearAllMocks();
  limparOuvintesDoCanal();
  sessionStorage.clear();
});

describe("as duas etapas", () => {
  it("busca leva à prévia", async () => {
    api.buscarProcessosPorOab.mockResolvedValue(previa());
    const { result } = renderHook(() => useImportacaoPorOab("sub"));

    await act(() => result.current.buscar("123456", "RS"));

    expect(result.current.etapa).toBe("previa");
    expect(result.current.previa?.processos).toHaveLength(1);
  });

  it("🔴 lista vazia é `vazio`, NÃO `erro`", () => {
    /* "Nada encontrado" é resposta de sucesso do PJe; "falhou" é o serviço
       fora do ar. Misturá-los mandaria a pessoa corrigir um número que está
       certo -- ou tentar de novo o que nunca vai funcionar. */
    api.buscarProcessosPorOab.mockResolvedValue(previa([]));
    const { result } = renderHook(() => useImportacaoPorOab("sub"));

    return act(() => result.current.buscar("999999", "SC")).then(() => {
      expect(result.current.etapa).toBe("vazio");
      expect(result.current.erro).toBe("");
    });
  });

  it("falha da API é `erro`, com a mensagem dela", async () => {
    api.buscarProcessosPorOab.mockRejectedValue(new Error("O PJe está limitando"));
    const { result } = renderHook(() => useImportacaoPorOab("sub"));

    await act(() => result.current.buscar("123456", "RS"));

    expect(result.current.etapa).toBe("erro");
    expect(result.current.erro).toBe("O PJe está limitando");
  });

  it("importar manda o id da busca, não os dados", async () => {
    api.buscarProcessosPorOab.mockResolvedValue(previa());
    api.importarProcessos.mockResolvedValue({
      cadastrados: 1, ja_existiam: 0, falharam: [],
    });
    const { result } = renderHook(() => useImportacaoPorOab("sub"));
    await act(() => result.current.buscar("123456", "RS"));

    await act(() => result.current.importar([ACHADO.numero_processo], ["eu@x.com"]));

    expect(api.importarProcessos).toHaveBeenCalledWith(
      "sub", "abc", [ACHADO.numero_processo], ["eu@x.com"],
    );
    expect(result.current.etapa).toBe("concluido");
  });
});

describe("a resposta velha não pode ganhar da nova", () => {
  it("🔴 buscar de novo descarta o resultado da primeira", async () => {
    /* Corrigir a OAB e buscar de novo pode fazer a primeira resposta chegar
       depois -- e a tela mostraria a lista da inscrição errada, sem nada
       indicando isso. */
    let resolverPrimeira: (v: unknown) => void = () => {};
    api.buscarProcessosPorOab
      .mockImplementationOnce(() => new Promise((r) => (resolverPrimeira = r)))
      .mockResolvedValueOnce(previa([{ ...ACHADO, apelido: "A CERTA" }]));

    const { result } = renderHook(() => useImportacaoPorOab("sub"));
    act(() => void result.current.buscar("111111", "RS"));
    await act(() => result.current.buscar("222222", "RS"));

    await act(async () => resolverPrimeira(previa([{ ...ACHADO, apelido: "A ERRADA" }])));

    expect(result.current.previa?.processos[0].apelido).toBe("A CERTA");
  });

  it("recomeçar descarta a busca em curso", async () => {
    let resolver: (v: unknown) => void = () => {};
    api.buscarProcessosPorOab.mockImplementation(() => new Promise((r) => (resolver = r)));
    const { result } = renderHook(() => useImportacaoPorOab("sub"));
    act(() => void result.current.buscar("123456", "RS"));

    act(() => result.current.recomecar());
    await act(async () => resolver(previa()));

    expect(result.current.etapa).toBe("formulario");
    expect(result.current.previa).toBeNull();
  });
});

describe("a barra de progresso", () => {
  it("acompanha o canal", async () => {
    const { result } = renderHook(() => useImportacaoPorOab("sub"));

    act(() => {
      publicarNoCanal({
        tipo: "importacao_progresso", feitos: 25, total: 100,
      } as unknown as MensagemDoCanal);
    });

    await waitFor(() => expect(result.current.progresso).toEqual({ feitos: 25, total: 100 }));
  });

  it("🔴 ouve o canal ANTES de a importação começar", async () => {
    /* A primeira mensagem (`feitos: 0`) sai antes de o `await` devolver o
       controle. Assinar ao clicar em "Importar" perderia justamente ela -- a
       barra começaria do segundo pulso, ou de lugar nenhum numa importação
       curta. */
    const { result } = renderHook(() => useImportacaoPorOab("sub"));

    act(() => {
      publicarNoCanal({
        tipo: "importacao_progresso", feitos: 0, total: 3,
      } as unknown as MensagemDoCanal);
    });

    await waitFor(() => expect(result.current.progresso).toEqual({ feitos: 0, total: 3 }));
  });

  it("nasce em zero ao importar, para a barra existir sem o canal", async () => {
    /* Se o WebSocket estiver fechado, nenhuma mensagem chega -- e a barra
       precisa aparecer mesmo assim, indeterminada, em vez de sumir. */
    api.buscarProcessosPorOab.mockResolvedValue(previa());
    api.importarProcessos.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useImportacaoPorOab("sub"));
    await act(() => result.current.buscar("123456", "RS"));

    act(() => void result.current.importar(["a", "b"], []));

    await waitFor(() => expect(result.current.progresso).toEqual({ feitos: 0, total: 2 }));
  });

  it("para de ouvir ao desmontar", () => {
    const { result, unmount } = renderHook(() => useImportacaoPorOab("sub"));
    unmount();

    publicarNoCanal({
      tipo: "importacao_progresso", feitos: 9, total: 9,
    } as unknown as MensagemDoCanal);

    expect(result.current.progresso).toBeNull();
  });
});

describe("a interrupção no meio", () => {
  it("🔴 a mensagem NÃO afirma que nada foi gravado", async () => {
    /* Um timeout deixa os processos já criados no banco. Dizer "a importação
       falhou" mandaria a pessoa procurar o que já está lá. */
    api.buscarProcessosPorOab.mockResolvedValue(previa());
    api.importarProcessos.mockRejectedValue({});
    const { result } = renderHook(() => useImportacaoPorOab("sub"));
    await act(() => result.current.buscar("123456", "RS"));

    await act(() => result.current.importar(["a"], []));

    expect(result.current.erro).toContain("pode ter sido cadastrada");
    expect(result.current.erro).toContain("só o que falta");
  });
});


describe("🔴 a busca em segundo plano (API da Fase 3b: 202 e o canal)", () => {
  const OUTRO = { ...ACHADO, numero_processo: "50000011220248210001", apelido: "Usucapião" };

  function pagina(trabalho_id: string, processos: unknown[]) {
    return { tipo: "importacao_busca", trabalho_id, processos } as unknown as MensagemDoCanal;
  }
  function fim(trabalho_id: string, extra = {}) {
    return { tipo: "importacao_busca_fim", trabalho_id, ...extra } as unknown as MensagemDoCanal;
  }

  async function buscarComId(result: { current: ReturnType<typeof useImportacaoPorOab> }, id = "t-1") {
    api.buscarProcessosPorOab.mockResolvedValue({ trabalho_id: id });
    await act(() => result.current.buscar("123456", "RS"));
  }

  it("fica em `buscando` e FUNDE as páginas pelo número (substitui, não acrescenta)", async () => {
    const { result } = renderHook(() => useImportacaoPorOab("sub"));
    await buscarComId(result);

    act(() => publicarNoCanal(pagina("t-1", [{ ...ACHADO, comunicacoes: 3 }])));
    act(() => publicarNoCanal(pagina("t-1", [OUTRO, { ...ACHADO, comunicacoes: 5 }])));

    expect(result.current.etapa).toBe("buscando");
    expect(result.current.parcial.map((p) => [p.numero_processo, p.comunicacoes])).toEqual([
      [ACHADO.numero_processo, 5],
      [OUTRO.numero_processo, 3],
    ]);
  });

  it("⚠️ página de OUTRA busca é descartada", async () => {
    const { result } = renderHook(() => useImportacaoPorOab("sub"));
    await buscarComId(result);

    act(() => publicarNoCanal(pagina("t-velha", [ACHADO])));

    expect(result.current.parcial).toEqual([]);
  });

  it("o fim relê pelo GET, e a prévia é a do GET (fonte), não a das páginas", async () => {
    /* ⚠️ A primeira volta da releitura periódica sai logo, e ainda está na fila:
       sem isto a prévia chegaria por ELA, e o teste passaria com o fim ignorado. */
    api.lerBusca.mockResolvedValueOnce({ trabalho_id: "t-1", estado: "na_fila" }).mockResolvedValue({
      trabalho_id: "t-1", estado: "concluido", id: "bloco", total_encontrado: 2,
      atingiu_o_teto: true, processos: [ACHADO, OUTRO],
    });
    const { result } = renderHook(() => useImportacaoPorOab("sub"));
    await buscarComId(result);
    await waitFor(() => expect(api.lerBusca).toHaveBeenCalledTimes(1));
    act(() => publicarNoCanal(pagina("t-1", [ACHADO])));
    expect(result.current.etapa).toBe("buscando");

    await act(async () => publicarNoCanal(fim("t-1")));

    await waitFor(() => expect(result.current.etapa).toBe("previa"));
    expect(api.lerBusca).toHaveBeenCalledTimes(2);
    expect(api.lerBusca).toHaveBeenCalledWith("sub", "t-1");
    expect(result.current.previa).toEqual({
      id: "bloco", total_encontrado: 2, atingiu_o_teto: true, processos: [ACHADO, OUTRO],
    });
  });

  it("fim sem nada encontrado é `vazio`, e o PJe fora é `erro` com a mensagem", async () => {
    api.lerBusca.mockResolvedValue({ trabalho_id: "t-1", estado: "concluido", id: "b", processos: [] });
    const { result } = renderHook(() => useImportacaoPorOab("sub"));
    await buscarComId(result);
    await act(async () => publicarNoCanal(fim("t-1")));
    await waitFor(() => expect(result.current.etapa).toBe("vazio"));

    api.lerBusca.mockResolvedValueOnce({ trabalho_id: "t-2", estado: "falhou", erro: "O PJe está limitando" });
    await buscarComId(result, "t-2");
    await act(async () => publicarNoCanal(fim("t-2", { erro: "O PJe está limitando" })));
    await waitFor(() => expect(result.current.etapa).toBe("erro"));
    expect(result.current.erro).toBe("O PJe está limitando");
  });

  it("🔴 sem canal, a releitura periódica traz o fim", async () => {
    vi.useFakeTimers();
    try {
      api.lerBusca
        .mockResolvedValueOnce({ trabalho_id: "t-1", estado: "na_fila" })
        .mockResolvedValue({ trabalho_id: "t-1", estado: "concluido", id: "b", processos: [ACHADO] });
      const { result } = renderHook(() => useImportacaoPorOab("sub"));
      await buscarComId(result);

      await act(async () => vi.advanceTimersByTime(0));
      expect(result.current.etapa).toBe("buscando");
      await act(async () => vi.advanceTimersByTime(5000));

      expect(result.current.etapa).toBe("previa");
    } finally {
      vi.useRealTimers();
    }
  });

  it("a tela reaberta volta à busca guardada, e recomeçar a esquece", async () => {
    sessionStorage.setItem("argos:busca-por-oab:sub", "t-9");
    api.lerBusca.mockResolvedValue({ trabalho_id: "t-9", estado: "concluido", id: "b", processos: [ACHADO] });
    const { result } = renderHook(() => useImportacaoPorOab("sub"));

    await waitFor(() => expect(result.current.etapa).toBe("previa"));
    expect(sessionStorage.getItem("argos:busca-por-oab:sub")).toBeNull();

    sessionStorage.setItem("argos:busca-por-oab:sub", "t-10");
    act(() => result.current.recomecar());
    expect(sessionStorage.getItem("argos:busca-por-oab:sub")).toBeNull();
  });

  it("o par negativo: a resposta ANTIGA (a prévia inteira) continua funcionando", async () => {
    api.buscarProcessosPorOab.mockResolvedValue(previa());
    const { result } = renderHook(() => useImportacaoPorOab("sub"));
    await act(() => result.current.buscar("123456", "RS"));

    expect(result.current.etapa).toBe("previa");
    expect(api.lerBusca).not.toHaveBeenCalled();
  });
});
