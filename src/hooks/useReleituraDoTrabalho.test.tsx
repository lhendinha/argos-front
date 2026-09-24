import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ estaAutenticado: vi.fn(() => true), dispararAutenticacaoInvalida: vi.fn() }));
vi.mock("../services/auth", () => ({ estaAutenticado: auth.estaAutenticado }));
vi.mock("../services/authBridge", () => ({ dispararAutenticacaoInvalida: auth.dispararAutenticacaoInvalida }));

import { LIMIAR_SEM_CONTATO_MS, TIPO_DO_FIM_DA_GRAVACAO } from "../constants";
import { ApiError } from "../services/api";
import { limparOuvintesDoCanal, publicarNoCanal } from "../utils/canalDeTempoReal";
import { useReleituraDoTrabalho } from "./useReleituraDoTrabalho";
import type { MensagemDoCanal, TrabalhoLido } from "../types";

const NA_FILA: TrabalhoLido = { trabalho_id: "t-1", estado: "na_fila" };
const CONCLUIDO: TrabalhoLido = { trabalho_id: "t-1", estado: "concluido" };

function esperar(ler: (id: string) => Promise<TrabalhoLido>, trabalhoId: string | null = "t-1") {
  const aoTerminar = vi.fn();
  const aoDesistir = vi.fn();
  const hook = renderHook(() =>
    useReleituraDoTrabalho({ trabalhoId, ler, tipoDoFim: TIPO_DO_FIM_DA_GRAVACAO, aoTerminar, aoDesistir }),
  );
  return { ...hook, aoTerminar, aoDesistir };
}

/** Avança o relógio e deixa as promessas resolverem. */
const passar = (ms: number) => act(async () => vi.advanceTimersByTimeAsync(ms));

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  auth.estaAutenticado.mockReturnValue(true);
  limparOuvintesDoCanal();
});
afterEach(() => vi.useRealTimers());

describe("🔴 só erro DEFINITIVO encerra a espera", () => {
  it.each([
    ["404: o trabalho sumiu, expirou ou é de outra pessoa", new ApiError("Busca não encontrada", 404)],
    ["403: perdeu o acesso", new ApiError("Sem permissão", 403)],
  ])("%s -> desiste, com o erro", async (_, erro) => {
    const { aoDesistir, aoTerminar } = esperar(vi.fn().mockRejectedValue(erro));
    await passar(0);
    expect(aoDesistir).toHaveBeenCalledWith(erro);
    expect(aoTerminar).not.toHaveBeenCalled();
  });

  it.each([
    ["rede (fetch falhando)", new TypeError("Failed to fetch")],
    ["502 do Gateway durante um deploy", new ApiError("Bad Gateway", 502)],
    ["429 do limite do estágio", new ApiError("Too Many Requests", 429)],
    ["401 com a sessão VIVA (a renovação caiu por rede)", new ApiError("Unauthorized", 401)],
  ])("%s -> tenta de novo, e o trabalho termina bem", async (_, erro) => {
    const ler = vi.fn().mockRejectedValueOnce(erro).mockResolvedValue(CONCLUIDO);
    const { aoDesistir, aoTerminar } = esperar(ler);
    await passar(0);
    expect(aoDesistir).not.toHaveBeenCalled();
    await passar(5000);
    expect(aoTerminar).toHaveBeenCalledWith(CONCLUIDO);
    expect(aoDesistir).not.toHaveBeenCalled();
  });

  it("401 com a sessão MORTA leva ao login, sem mostrar erro na tela", async () => {
    auth.estaAutenticado.mockReturnValue(false);
    const { aoDesistir } = esperar(vi.fn().mockRejectedValue(new ApiError("Unauthorized", 401)));
    await passar(0);
    expect(auth.dispararAutenticacaoInvalida).toHaveBeenCalledTimes(1);
    expect(aoDesistir).not.toHaveBeenCalled();
  });

  it("o par: sem trabalho a esperar, não lê nada", async () => {
    const ler = vi.fn().mockResolvedValue(NA_FILA);
    esperar(ler, null);
    await passar(20_000);
    expect(ler).not.toHaveBeenCalled();
  });
});

describe("⚠️ o aviso de SEM CONTATO", () => {
  it("aparece depois do limiar de falhas SEGUIDAS, e some quando o servidor volta", async () => {
    let fora = true;
    const ler = vi.fn(async () => {
      if (fora) throw new TypeError("Failed to fetch");
      return NA_FILA;
    });
    const { result } = esperar(ler);
    await passar(LIMIAR_SEM_CONTATO_MS - 5000);
    expect(result.current).toBe(false);
    await passar(5000);
    expect(result.current).toBe(true);

    fora = false;
    await passar(5000);
    expect(result.current).toBe(false);
  });

  it("conta da PRIMEIRA falha seguida, e não do último sucesso (o notebook que dormiu)", async () => {
    let fora = false;
    const ler = vi.fn(async () => {
      if (fora) throw new TypeError("Failed to fetch");
      return NA_FILA;
    });
    const { result } = esperar(ler);
    await passar(60_000);
    fora = true;
    await passar(5000);
    expect(result.current).toBe(false);
  });

  it("o SUCESSO zera a contagem: uma falha antiga não acende o aviso na próxima", async () => {
    /* A 1ª leitura falha, doze dão certo, e a 15ª -- a última antes de conferir -- falha de novo. */
    const falhas = new Set([1, 15]);
    let leitura = 0;
    const ler = vi.fn(async () => {
      leitura++;
      if (falhas.has(leitura)) throw new TypeError("Failed to fetch");
      return NA_FILA;
    });
    const { result } = esperar(ler);
    await passar(14 * 5000);
    expect(ler).toHaveBeenCalledTimes(15);
    expect(result.current).toBe(false);
  });

  it("a leitura PRESA também é falta de contato -- o fetch sem resposta não falha", async () => {
    const ler = vi.fn(() => new Promise<TrabalhoLido>(() => {}));
    const { result } = esperar(ler);
    await passar(LIMIAR_SEM_CONTATO_MS + 5000);
    expect(result.current).toBe(true);
    expect(ler).toHaveBeenCalledTimes(1);
  });
});

describe("⚠️ uma leitura por vez", () => {
  it("o fim que chega DURANTE uma leitura a repete no fim dela, e nunca em paralelo", async () => {
    let emVoo = 0;
    let maximo = 0;
    const respostas = [NA_FILA, CONCLUIDO];
    const ler = vi.fn(async () => {
      emVoo++;
      maximo = Math.max(maximo, emVoo);
      await new Promise((r) => setTimeout(r, 1000));
      emVoo--;
      return respostas.shift() ?? CONCLUIDO;
    });
    const { aoTerminar } = esperar(ler);
    await passar(10);
    act(() => publicarNoCanal({ tipo: TIPO_DO_FIM_DA_GRAVACAO, trabalho_id: "t-1" } as unknown as MensagemDoCanal));
    await passar(3000);
    expect(maximo).toBe(1);
    expect(ler).toHaveBeenCalledTimes(2);
    expect(aoTerminar).toHaveBeenCalledWith(CONCLUIDO);
  });

  it("o fim de OUTRO trabalho não dispara leitura", async () => {
    const ler = vi.fn().mockResolvedValue(NA_FILA);
    esperar(ler);
    await passar(0);
    act(() => publicarNoCanal({ tipo: TIPO_DO_FIM_DA_GRAVACAO, trabalho_id: "outro" } as unknown as MensagemDoCanal));
    await passar(100);
    expect(ler).toHaveBeenCalledTimes(1);
  });
});
