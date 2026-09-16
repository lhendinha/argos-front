import { beforeEach, describe, expect, it, vi } from "vitest";

const chamar = vi.hoisted(() => vi.fn());
vi.mock("./client", () => ({ chamar }));

import { listarCentrosDeCusto, listarContas } from "./financeiro";

beforeEach(() => {
  vi.clearAllMocks();
  chamar.mockResolvedValue({});
});

describe("as listas paginadas do catálogo", () => {
  it("🔴 contas levam o ESTADO junto da página", async () => {
    /* Só um teste de serviço pega isto: os testes de tela simulam o módulo de
       serviços inteiro, então o estado sumindo da chamada passaria batido --
       foi o que aconteceu no passo 4.4c, com a busca de clientes. */
    await listarContas({ pagina: 2, tamanhoPagina: 10, estado: "arquivados" });
    expect(chamar).toHaveBeenCalledWith("/financeiro/contas", {
      query: { pagina: "2", tamanho_pagina: "10", estado: "arquivados" },
    });
  });

  it("centros de custo também", async () => {
    await listarCentrosDeCusto({ pagina: 1, tamanhoPagina: 10, estado: "todos" });
    expect(chamar).toHaveBeenCalledWith("/financeiro/centros-de-custo", {
      query: { pagina: "1", tamanho_pagina: "10", estado: "todos" },
    });
  });

  it("sem estado, o parâmetro simplesmente não vai -- e a API devolve os ativos", async () => {
    await listarContas({ pagina: 1, tamanhoPagina: 10 });
    expect(chamar).toHaveBeenCalledWith("/financeiro/contas", {
      query: { pagina: "1", tamanho_pagina: "10", estado: undefined },
    });
  });

  it("⚠️ não existe rota paginada de categorias -- a lista delas vem inteira", async () => {
    const financeiro = await import("./financeiro");
    expect("listarCategorias" in financeiro).toBe(false);
  });
});
