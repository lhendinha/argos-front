import { beforeEach, describe, expect, it, vi } from "vitest";

const chamar = vi.hoisted(() => vi.fn());
vi.mock("./client", () => ({ chamar }));

import { arquivarCliente, listarClientes, reativarCliente } from "./clientes";

beforeEach(() => {
  vi.clearAllMocks();
  chamar.mockResolvedValue({});
});

describe("as rotas de cliente", () => {
  it("a listagem leva página e tamanho em snake_case, como texto", async () => {
    await listarClientes({ pagina: 3, tamanhoPagina: 20 });
    expect(chamar).toHaveBeenCalledWith("/clientes", {
      query: { pagina: "3", tamanho_pagina: "20", estado: undefined },
    });
  });

  it("🔴 o estado vai também na BUSCA -- senão procurar um arquivado não acha nada", async () => {
    /* A busca é o outro ramo da mesma rota, e é ali que a pessoa vai quando
       o nome não está na página aberta. Sem o estado, "Arquivados" com termo
       digitado devolvia os ativos que batem -- uma lista que contradiz o
       filtro aceso logo acima dela. */
    await listarClientes({ busca: "maria", estado: "arquivados" });
    expect(chamar).toHaveBeenCalledWith("/clientes", {
      query: { busca: "maria", estado: "arquivados" },
    });
  });

  it("a listagem paginada também leva o estado", async () => {
    await listarClientes({ pagina: 1, tamanhoPagina: 10, estado: "todos" });
    expect(chamar).toHaveBeenCalledWith("/clientes", {
      query: { pagina: "1", tamanho_pagina: "10", estado: "todos" },
    });
  });

  it("🔴 arquivar e reativar são POST em rotas DIFERENTES", async () => {
    /* O par negativo importa: as duas funções têm a mesma forma, e trocar a
       rota de uma pela da outra passa despercebido em qualquer teste de tela
       -- ali o módulo inteiro é simulado. */
    await arquivarCliente("c1");
    expect(chamar).toHaveBeenCalledWith("/clientes/c1/arquivar", { method: "POST" });
    await reativarCliente("c1");
    expect(chamar).toHaveBeenLastCalledWith("/clientes/c1/reativar", { method: "POST" });
  });
});
