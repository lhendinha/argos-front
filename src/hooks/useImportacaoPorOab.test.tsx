import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/* ⚠️ `vi.hoisted` porque `vi.mock` é içado para o topo do arquivo: um objeto
 * declarado normalmente ainda não existe quando a fábrica roda. */
const api = vi.hoisted(() => ({
  buscarProcessosPorOab: vi.fn(),
  importarProcessos: vi.fn(),
  lerBusca: vi.fn(),
  lerGravacao: vi.fn(),
}));
/* ⚠️ O `ApiError` de verdade: a espera classifica o erro por ele. */
vi.mock("../services/api", async (original) => ({ ...(await original<object>()), ...api }));

import { useImportacaoPorOab } from "./useImportacaoPorOab";
import { CHAVE_DA_IMPORTACAO_GUARDADA } from "../constants";
import { limparOuvintesDoCanal, publicarNoCanal } from "../utils/canalDeTempoReal";
import { guardarImportacao } from "../utils/importacaoGuardada";
import type { MensagemDoCanal } from "../types";

const EU = "eu@escritorio.com";

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
    const { result } = renderHook(() => useImportacaoPorOab("sub", EU));

    await act(() => result.current.buscar("123456", "RS"));

    expect(result.current.etapa).toBe("previa");
    expect(result.current.previa?.processos).toHaveLength(1);
  });

  it("🔴 lista vazia é `vazio`, NÃO `erro`", () => {
    /* "Nada encontrado" é resposta de sucesso do PJe; "falhou" é o serviço
       fora do ar. Misturá-los mandaria a pessoa corrigir um número que está
       certo -- ou tentar de novo o que nunca vai funcionar. */
    api.buscarProcessosPorOab.mockResolvedValue(previa([]));
    const { result } = renderHook(() => useImportacaoPorOab("sub", EU));

    return act(() => result.current.buscar("999999", "SC")).then(() => {
      expect(result.current.etapa).toBe("vazio");
      expect(result.current.erro).toBe("");
    });
  });

  it("falha da API é `erro`, com a mensagem dela", async () => {
    api.buscarProcessosPorOab.mockRejectedValue(new Error("O PJe está limitando"));
    const { result } = renderHook(() => useImportacaoPorOab("sub", EU));

    await act(() => result.current.buscar("123456", "RS"));

    expect(result.current.etapa).toBe("erro");
    expect(result.current.erro).toBe("O PJe está limitando");
  });

  it("importar manda o id da busca, não os dados", async () => {
    api.buscarProcessosPorOab.mockResolvedValue(previa());
    api.importarProcessos.mockResolvedValue({
      cadastrados: 1, ja_existiam: 0, falharam: [],
    });
    const { result } = renderHook(() => useImportacaoPorOab("sub", EU));
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

    const { result } = renderHook(() => useImportacaoPorOab("sub", EU));
    act(() => void result.current.buscar("111111", "RS"));
    await act(() => result.current.buscar("222222", "RS"));

    await act(async () => resolverPrimeira(previa([{ ...ACHADO, apelido: "A ERRADA" }])));

    expect(result.current.previa?.processos[0].apelido).toBe("A CERTA");
  });

  it("recomeçar descarta a busca em curso", async () => {
    let resolver: (v: unknown) => void = () => {};
    api.buscarProcessosPorOab.mockImplementation(() => new Promise((r) => (resolver = r)));
    const { result } = renderHook(() => useImportacaoPorOab("sub", EU));
    act(() => void result.current.buscar("123456", "RS"));

    act(() => result.current.recomecar());
    await act(async () => resolver(previa()));

    expect(result.current.etapa).toBe("formulario");
    expect(result.current.previa).toBeNull();
  });
});

describe("a barra de progresso", () => {
  async function gravando(id = "g-1") {
    api.buscarProcessosPorOab.mockResolvedValue(previa());
    api.importarProcessos.mockResolvedValue({ trabalho_id: id });
    api.lerGravacao.mockResolvedValue({ trabalho_id: id, estado: "na_fila" });
    const hook = renderHook(() => useImportacaoPorOab("sub", EU));
    await act(() => hook.result.current.buscar("123456", "RS"));
    return hook;
  }

  it("acompanha o canal, pela gravação desta tela", async () => {
    const { result } = await gravando();
    await act(() => result.current.importar(["a"], []));

    act(() => {
      publicarNoCanal({
        tipo: "importacao_progresso", trabalho_id: "g-1", feitos: 25, total: 100,
      } as unknown as MensagemDoCanal);
    });

    await waitFor(() => expect(result.current.progresso).toEqual({ feitos: 25, total: 100 }));
  });

  it("🔴 ouve o canal ANTES de a importação começar", async () => {
    /* A primeira mensagem (`feitos: 0`) pode sair antes de o `202` devolver o
       id. Assinar ao clicar em "Importar" perderia justamente ela -- a barra
       começaria do segundo pulso, ou de lugar nenhum numa importação curta. */
    const { result } = await gravando();
    act(() => {
      publicarNoCanal({
        tipo: "importacao_progresso", trabalho_id: "g-1", feitos: 2, total: 3,
      } as unknown as MensagemDoCanal);
    });

    await act(() => result.current.importar(["a", "b", "c"], []));

    await waitFor(() => expect(result.current.progresso).toEqual({ feitos: 2, total: 3 }));
  });

  it("nasce em zero ao importar, para a barra existir sem o canal", async () => {
    /* Se o WebSocket estiver fechado, nenhuma mensagem chega -- e a barra
       precisa aparecer mesmo assim, indeterminada, em vez de sumir. */
    api.buscarProcessosPorOab.mockResolvedValue(previa());
    api.importarProcessos.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useImportacaoPorOab("sub", EU));
    await act(() => result.current.buscar("123456", "RS"));

    act(() => void result.current.importar(["a", "b"], []));

    await waitFor(() => expect(result.current.progresso).toEqual({ feitos: 0, total: 2 }));
  });

  it("para de ouvir ao desmontar", () => {
    const { result, unmount } = renderHook(() => useImportacaoPorOab("sub", EU));
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
    const { result } = renderHook(() => useImportacaoPorOab("sub", EU));
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
    const { result } = renderHook(() => useImportacaoPorOab("sub", EU));
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
    const { result } = renderHook(() => useImportacaoPorOab("sub", EU));
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
    const { result } = renderHook(() => useImportacaoPorOab("sub", EU));
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
    /* ⚠️ A leitura imediata responde "na fila" nas DUAS metades: sem isto o
       resultado chegava por ela, e o teste passava com o canal quebrado. */
    api.lerBusca
      .mockResolvedValueOnce({ trabalho_id: "t-1", estado: "na_fila" })
      .mockResolvedValueOnce({ trabalho_id: "t-1", estado: "concluido", id: "b", processos: [] });
    const { result } = renderHook(() => useImportacaoPorOab("sub", EU));
    await buscarComId(result);
    await waitFor(() => expect(api.lerBusca).toHaveBeenCalledTimes(1));
    expect(result.current.etapa).toBe("buscando");
    await act(async () => publicarNoCanal(fim("t-1")));
    await waitFor(() => expect(result.current.etapa).toBe("vazio"));

    api.lerBusca
      .mockResolvedValueOnce({ trabalho_id: "t-2", estado: "na_fila" })
      .mockResolvedValueOnce({ trabalho_id: "t-2", estado: "falhou", erro: "O PJe está limitando" });
    await buscarComId(result, "t-2");
    await waitFor(() => expect(api.lerBusca).toHaveBeenCalledTimes(3));
    expect(result.current.etapa).toBe("buscando");
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
      const { result } = renderHook(() => useImportacaoPorOab("sub", EU));
      await buscarComId(result);

      await act(async () => vi.advanceTimersByTime(0));
      expect(result.current.etapa).toBe("buscando");
      await act(async () => vi.advanceTimersByTime(5000));

      expect(result.current.etapa).toBe("previa");
    } finally {
      vi.useRealTimers();
    }
  });

  it("o par negativo: a resposta ANTIGA (a prévia inteira) continua funcionando", async () => {
    api.buscarProcessosPorOab.mockResolvedValue(previa());
    const { result } = renderHook(() => useImportacaoPorOab("sub", EU));
    await act(() => result.current.buscar("123456", "RS"));

    expect(result.current.etapa).toBe("previa");
    expect(api.lerBusca).not.toHaveBeenCalled();
  });
});


describe("sem subgrupo", () => {
  it("🔴 não manda o pedido, e diz o que falta", async () => {
    const { result } = renderHook(() => useImportacaoPorOab("", EU));

    await act(() => result.current.buscar("123456", "RS"));

    expect(api.buscarProcessosPorOab).not.toHaveBeenCalled();
    expect(result.current.etapa).toBe("erro");
    expect(result.current.erro).toMatch(/subgrupo/);
  });
});


describe("🔴 a gravação em segundo plano (API da Fase 4: 202 e o canal)", () => {
  const FIM = (trabalho_id: string) =>
    ({ tipo: "importacao_fim", trabalho_id }) as unknown as MensagemDoCanal;

  async function importarComId(id = "g-1") {
    api.buscarProcessosPorOab.mockResolvedValue(previa());
    api.importarProcessos.mockResolvedValue({ trabalho_id: id });
    const hook = renderHook(() => useImportacaoPorOab("sub", EU));
    await act(() => hook.result.current.buscar("123456", "RS"));
    await act(() => hook.result.current.importar([ACHADO.numero_processo], []));
    return hook;
  }

  it("fica em `importando`, com a barra, até o fim; o fim relê os TRÊS números pelo GET", async () => {
    /* A primeira leitura sai logo e ainda está na fila: o resultado só pode vir pelo fim. */
    api.lerGravacao.mockResolvedValueOnce({ trabalho_id: "g-1", estado: "na_fila" }).mockResolvedValue({
      trabalho_id: "g-1", estado: "concluido", cadastrados: 1, ja_existiam: 0, falharam: [],
    });
    const { result } = await importarComId();
    await waitFor(() => expect(api.lerGravacao).toHaveBeenCalledTimes(1));
    expect(result.current.etapa).toBe("importando");
    act(() => publicarNoCanal({ tipo: "importacao_progresso", trabalho_id: "g-1", feitos: 1, total: 1 } as unknown as MensagemDoCanal));
    expect(result.current.progresso).toEqual({ feitos: 1, total: 1 });

    await act(async () => publicarNoCanal(FIM("g-1")));

    await waitFor(() => expect(result.current.etapa).toBe("concluido"));
    expect(api.lerGravacao).toHaveBeenCalledWith("sub", "g-1");
    expect(result.current.resultado).toEqual({ cadastrados: 1, ja_existiam: 0, falharam: [] });
  });

  it("a gravação que caiu no meio é `erro`, com a mensagem de que PARTE pode estar gravada", async () => {
    api.lerGravacao
      .mockResolvedValueOnce({ trabalho_id: "g-1", estado: "na_fila" })
      .mockResolvedValue({ trabalho_id: "g-1", estado: "falhou", erro: "A importação foi interrompida" });
    const { result } = await importarComId();
    await waitFor(() => expect(api.lerGravacao).toHaveBeenCalledTimes(1));
    await act(async () => publicarNoCanal(FIM("g-1")));
    await waitFor(() => expect(result.current.etapa).toBe("erro"));
    expect(result.current.erro).toBe("A importação foi interrompida");
  });

  it("⚠️ o fim de OUTRA gravação é descartado, e recomeçar esquece a que estava em curso", async () => {
    api.lerGravacao.mockResolvedValue({ trabalho_id: "g-1", estado: "na_fila" });
    const { result } = await importarComId();
    await waitFor(() => expect(api.lerGravacao).toHaveBeenCalledTimes(1));
    await act(async () => publicarNoCanal(FIM("g-velha")));
    expect(api.lerGravacao).toHaveBeenCalledTimes(1);

    act(() => result.current.recomecar());
    await act(async () => publicarNoCanal(FIM("g-1")));
    expect(api.lerGravacao).toHaveBeenCalledTimes(1);
    expect(result.current.etapa).toBe("formulario");
  });

  it("🔴 sem canal, a releitura periódica traz o fim", async () => {
    vi.useFakeTimers();
    try {
      api.lerGravacao
        .mockResolvedValueOnce({ trabalho_id: "g-1", estado: "na_fila" })
        .mockResolvedValue({ trabalho_id: "g-1", estado: "concluido", cadastrados: 1, ja_existiam: 0, falharam: [] });
      const { result } = await importarComId();

      await act(async () => vi.advanceTimersByTime(0));
      expect(result.current.etapa).toBe("importando");
      await act(async () => vi.advanceTimersByTime(5000));

      expect(result.current.etapa).toBe("concluido");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("as funções do hook", () => {
  it("⚠️ `importar` e `recomecar` são as MESMAS entre renders", () => {
    /* Quem garante é o React Compiler (`vite.config.ts`): o retorno de
       `useGravacaoEmSegundoPlano` é um objeto literal, e sem o compilador as duas,
       que dependem dele, seriam recriadas a cada render. Um `useMemo` à mão ali
       não mudou nada -- a mutação que o tirava sobrevivia. */
    const { result, rerender } = renderHook(() => useImportacaoPorOab("sub", EU));
    const antes = result.current;
    rerender();
    expect(result.current.importar).toBe(antes.importar);
    expect(result.current.recomecar).toBe(antes.recomecar);
  });
});

describe("🔴 a importação guardada na aba, e o subgrupo travado (itens 10 e 11)", () => {
  const guardada = () => JSON.parse(sessionStorage.getItem(CHAVE_DA_IMPORTACAO_GUARDADA) ?? "null");
  const progresso = (trabalho_id: string | undefined, feitos: number, total: number) =>
    ({ tipo: "importacao_progresso", trabalho_id, feitos, total }) as unknown as MensagemDoCanal;

  it("volta à busca no subgrupo DELA, e não no do seletor -- e a prévia continua guardada", async () => {
    guardarImportacao({ email: EU, subgrupoId: "s-criminal", busca: "t-9" });
    api.lerBusca.mockResolvedValue({ trabalho_id: "t-9", estado: "concluido", id: "b", processos: [ACHADO] });
    const { result } = renderHook(() => useImportacaoPorOab("s-civel", EU));

    await waitFor(() => expect(result.current.etapa).toBe("previa"));
    expect(api.lerBusca).toHaveBeenCalledWith("s-criminal", "t-9");
    expect(result.current.subgrupoId).toBe("s-criminal");
    expect(result.current.importacaoEmCurso).toBe(true);
    expect(guardada()).toEqual({ email: EU, subgrupoId: "s-criminal", busca: "t-9" });
  });

  it("⚠️ a de OUTRA pessoa na mesma aba não é retomada", async () => {
    guardarImportacao({ email: "outra@escritorio.com", subgrupoId: "s-criminal", busca: "t-9" });
    const { result } = renderHook(() => useImportacaoPorOab("s-civel", EU));
    await act(async () => {});
    expect(result.current.etapa).toBe("formulario");
    expect(result.current.subgrupoId).toBe("s-civel");
    expect(api.lerBusca).not.toHaveBeenCalled();
  });

  it("buscar fixa o subgrupo da importação e a guarda; recomeçar esquece e solta", async () => {
    api.buscarProcessosPorOab.mockResolvedValue({ trabalho_id: "t-1" });
    api.lerBusca.mockResolvedValue({ trabalho_id: "t-1", estado: "na_fila" });
    const { result } = renderHook(() => useImportacaoPorOab("s-civel", EU));
    await act(() => result.current.buscar("123456", "RS"));

    expect(result.current.importacaoEmCurso).toBe(true);
    expect(guardada()).toEqual({ email: EU, subgrupoId: "s-civel", busca: "t-1" });

    act(() => result.current.recomecar());
    expect(result.current.importacaoEmCurso).toBe(false);
    expect(guardada()).toBeNull();
  });

  it("o par: a busca que acha NADA solta o subgrupo e não deixa nada guardado", async () => {
    api.buscarProcessosPorOab.mockResolvedValue({ trabalho_id: "t-1" });
    api.lerBusca.mockResolvedValue({ trabalho_id: "t-1", estado: "concluido", id: "b", processos: [] });
    const { result } = renderHook(() => useImportacaoPorOab("s-civel", EU));
    await act(() => result.current.buscar("123456", "RS"));
    await waitFor(() => expect(result.current.etapa).toBe("vazio"));
    expect(result.current.importacaoEmCurso).toBe(false);
    expect(guardada()).toBeNull();
  });

  it("importar guarda a gravação junto, e a tela recarregada volta a ela", async () => {
    guardarImportacao({ email: EU, subgrupoId: "s-criminal", busca: "t-9" });
    api.lerBusca.mockResolvedValue({ trabalho_id: "t-9", estado: "concluido", id: "b", processos: [ACHADO] });
    api.importarProcessos.mockResolvedValue({ trabalho_id: "g-9" });
    api.lerGravacao.mockResolvedValue({ trabalho_id: "g-9", estado: "na_fila" });
    const primeira = renderHook(() => useImportacaoPorOab("s-civel", EU));
    await waitFor(() => expect(primeira.result.current.etapa).toBe("previa"));
    await act(() => primeira.result.current.importar([ACHADO.numero_processo], []));
    expect(api.importarProcessos).toHaveBeenCalledWith("s-criminal", "b", [ACHADO.numero_processo], []);
    expect(guardada()).toEqual({ email: EU, subgrupoId: "s-criminal", busca: "t-9", gravacao: "g-9" });
    primeira.unmount();

    api.lerGravacao.mockResolvedValue({ trabalho_id: "g-9", estado: "concluido", cadastrados: 1, ja_existiam: 0, falharam: [] });
    const recarregada = renderHook(() => useImportacaoPorOab("s-civel", EU));
    expect(recarregada.result.current.etapa).toBe("importando");
    await waitFor(() => expect(recarregada.result.current.etapa).toBe("concluido"));
    expect(api.lerGravacao).toHaveBeenLastCalledWith("s-criminal", "g-9");
  });

  it("🔴 a barra mostra só a SUA gravação, só avança, e aproveita o pulso que chegou antes do 202", async () => {
    api.buscarProcessosPorOab.mockResolvedValue(previa());
    api.lerGravacao.mockResolvedValue({ trabalho_id: "g-1", estado: "na_fila" });
    let responder: (v: { trabalho_id: string }) => void = () => {};
    api.importarProcessos.mockReturnValue(new Promise((r) => (responder = r)));
    const { result } = renderHook(() => useImportacaoPorOab("s-civel", EU));
    await act(() => result.current.buscar("123456", "RS"));

    let pedido: Promise<void> = Promise.resolve();
    act(() => {
      pedido = result.current.importar([ACHADO.numero_processo], []);
    });
    expect(result.current.progresso).toEqual({ feitos: 0, total: 1 });
    act(() => publicarNoCanal(progresso("g-1", 3, 10)));
    await act(async () => {
      responder({ trabalho_id: "g-1" });
      await pedido;
    });
    expect(result.current.progresso).toEqual({ feitos: 3, total: 10 });

    act(() => publicarNoCanal(progresso("g-outra", 9, 9)));
    act(() => publicarNoCanal(progresso(undefined, 8, 8)));
    act(() => publicarNoCanal(progresso("g-1", 2, 10)));
    expect(result.current.progresso).toEqual({ feitos: 3, total: 10 });
    act(() => publicarNoCanal(progresso("g-1", 7, 10)));
    expect(result.current.progresso).toEqual({ feitos: 7, total: 10 });
  });
});
