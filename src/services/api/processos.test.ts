import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* A assinatura vai explícita: `vi.fn(async () => …)` infere ZERO parâmetros,
   e aí ler `mock.calls[0][1]` não compila. */
const mocks = vi.hoisted(() => ({
  chamar: vi.fn(async (_caminho: string, _opcoes?: { query?: Record<string, unknown> }) => ({})),
}));
vi.mock("./client", () => mocks);

import { listarProcessos, teorDaMovimentacao, temFiltroAtivo } from "./processos";

/** O que sai no fio, para a listagem de processos.
 *
 * 🔴 Este arquivo nasceu de uma mutação que NÃO derrubou o teste da tela: lá
 * a asserção era sobre o que `listarProcessos` recebe, e apagar o parâmetro
 * do corpo da query passava batido. Quem prova que o filtro chega ao
 * SERVIDOR é este nível.
 */
function queryEnviada() {
  return mocks.chamar.mock.calls[0][1]?.query as Record<string, unknown>;
}

beforeEach(() => vi.clearAllMocks());

describe("os filtros que chegam ao servidor", () => {
  it("🔴 o subgrupo escolhido vai como `subgrupo_id`", async () => {
    await listarProcessos({ subgrupoId: "sg-1" });
    expect(queryEnviada().subgrupo_id).toBe("sg-1");
  });

  it("os demais filtros continuam com o nome que a API espera", async () => {
    /* ⚠️ O par que impede o parâmetro novo empurrar outro fora: os nomes são
       contrato, e um `cliente_id` que virasse `clienteId` sumiria em silêncio
       (`montarQuery` só descarta vazio, não avisa nome errado). */
    await listarProcessos({
      busca: "posse",
      clienteId: "c1",
      subgrupoId: "sg-1",
      faseIds: ["f1"],
      situacaoIds: ["s1"],
      dataVerificarAte: "2026-08-30",
      prazoFinalAte: "2026-09-01",
      responsavelId: "eu@x.com",
    });

    expect(queryEnviada()).toMatchObject({
      busca: "posse",
      cliente_id: "c1",
      subgrupo_id: "sg-1",
      fase_id: ["f1"],
      situacao_id: ["s1"],
      data_verificar_ate: "2026-08-30",
      prazo_final_ate: "2026-09-01",
      responsavel_id: "eu@x.com",
    });
  });
});

describe("o que conta como filtro ativo", () => {
  it("🔴 o subgrupo conta -- senão a tela se diz sem filtro estando filtrada", () => {
    /* `temFiltroAtivo` decide o texto "Mostrando N de M" e o botão de limpar.
       Um filtro fora dessa conta esconde de quem olha que a lista está
       recortada. */
    expect(temFiltroAtivo({ subgrupoId: "sg-1" })).toBe(true);
  });

  it("sem nada, nada", () => {
    expect(temFiltroAtivo({})).toBe(false);
    expect(temFiltroAtivo({ subgrupoId: "" })).toBe(false);
  });
});

describe("o teor que não coube no banco vem por link", () => {
  const baixar = vi.fn();
  beforeEach(() => {
    baixar.mockReset();
    vi.stubGlobal("fetch", baixar);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("🔴 com `texto_url`, baixa o teor e o devolve em `texto`", async () => {
    mocks.chamar.mockResolvedValueOnce({ comunicacao_id: 9, texto: null, texto_url: "https://bucket/teores/x.html" });
    baixar.mockResolvedValueOnce(new Response("<p>o edital</p>", { status: 200 }));
    const teor = await teorDaMovimentacao("0001", 9);
    expect(baixar).toHaveBeenCalledWith("https://bucket/teores/x.html");
    expect(teor.texto).toBe("<p>o edital</p>");
  });

  it("o par: com o texto no banco, não baixa nada", async () => {
    mocks.chamar.mockResolvedValueOnce({ comunicacao_id: 1, texto: "<p>curto</p>", texto_url: null });
    const teor = await teorDaMovimentacao("0001", 1);
    expect(baixar).not.toHaveBeenCalled();
    expect(teor.texto).toBe("<p>curto</p>");
  });

  it("sem texto e sem link, devolve como veio (a tela diz que chegou sem o texto)", async () => {
    mocks.chamar.mockResolvedValueOnce({ comunicacao_id: 2, texto: null, texto_url: null });
    const teor = await teorDaMovimentacao("0001", 2);
    expect(baixar).not.toHaveBeenCalled();
    expect(teor.texto).toBeNull();
  });

  it("o download que falha vira ERRO, nunca teor vazio", async () => {
    mocks.chamar.mockResolvedValueOnce({ comunicacao_id: 9, texto: null, texto_url: "https://bucket/teores/x.html" });
    baixar.mockResolvedValueOnce(new Response("AccessDenied", { status: 403 }));
    await expect(teorDaMovimentacao("0001", 9)).rejects.toThrow("Não foi possível baixar");
  });
});
