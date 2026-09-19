import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ teorDaMovimentacao: vi.fn() }));
vi.mock("../../../services", () => mocks);

import { useTeorDaMovimentacao } from "./useTeorDaMovimentacao";

const NUMERO = "00012348520268160001";

/** 🔴 Um client com CACHE DE VERDADE, e é por isso que este teste existe fora da tela.
 *
 * O client dos testes de página usa `gcTime: 0`: a consulta some do cache assim que o modal fecha, então a colisão
 * de chave entre duas movimentações é **inobservável pela tela, por construção**. A mutação que apagava o id da
 * chave sobreviveu a dois testes de tela antes de eu perceber isso.
 */
function comCache() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe("o teor de cada movimentação tem cache SEPARADO", () => {
  it("duas movimentações do mesmo processo não dividem a entrada do cache", async () => {
    /* 🔴 Achado por MUTAÇÃO SOBREVIVENTE: tirar o id da chave da consulta ficava verde. Sem ele, abrir uma
       movimentação e depois outra serviria o teor da PRIMEIRA para a segunda -- texto errado, sem erro nenhum, na
       tela onde o texto é a única coisa que importa. */
    mocks.teorDaMovimentacao.mockImplementation((_numero: string, id: number | string) =>
      Promise.resolve({ comunicacao_id: id, texto: `teor da ${id}` }));
    const { client, wrapper } = comCache();

    const primeira = renderHook(() => useTeorDaMovimentacao(NUMERO, 4242), { wrapper });
    await waitFor(() => expect(primeira.result.current.data?.texto).toBe("teor da 4242"));

    const segunda = renderHook(() => useTeorDaMovimentacao(NUMERO, 777), { wrapper });
    await waitFor(() => expect(segunda.result.current.data?.texto).toBe("teor da 777"));

    // ⚠️ DUAS entradas no cache, e não uma sobrescrita: é a afirmação que a mutação quebra.
    const chaves = client.getQueryCache().getAll().map((c) => c.queryKey);
    expect(chaves).toHaveLength(2);
    expect(new Set(chaves.map((k) => JSON.stringify(k))).size).toBe(2);
  });

  it("a mesma movimentação NÃO é buscada duas vezes", async () => {
    /* O par: a chave separa o que é diferente e junta o que é igual. Uma chave nova a cada render pediria o mesmo
       teor a cada abertura, que é o oposto do que este passo veio fazer. */
    mocks.teorDaMovimentacao.mockResolvedValue({ comunicacao_id: 4242, texto: "um teor" });
    const { wrapper } = comCache();

    const primeira = renderHook(() => useTeorDaMovimentacao(NUMERO, 4242), { wrapper });
    await waitFor(() => expect(primeira.result.current.data?.texto).toBe("um teor"));
    const vezes = mocks.teorDaMovimentacao.mock.calls.length;

    const denovo = renderHook(() => useTeorDaMovimentacao(NUMERO, 4242), { wrapper });
    await waitFor(() => expect(denovo.result.current.data?.texto).toBe("um teor"));
    expect(mocks.teorDaMovimentacao.mock.calls.length).toBe(vezes);
  });

  it("processos DIFERENTES com o mesmo id de movimentação não se misturam", async () => {
    /* ⚠️ A chave leva os dois. O id da comunicação é do PJe e não é único entre processos. */
    mocks.teorDaMovimentacao.mockImplementation((numero: string) =>
      Promise.resolve({ comunicacao_id: 1, texto: `teor de ${numero}` }));
    const { wrapper } = comCache();

    const a = renderHook(() => useTeorDaMovimentacao("11111111111111111111", 1), { wrapper });
    await waitFor(() => expect(a.result.current.data?.texto).toBe("teor de 11111111111111111111"));

    const b = renderHook(() => useTeorDaMovimentacao("22222222222222222222", 1), { wrapper });
    await waitFor(() => expect(b.result.current.data?.texto).toBe("teor de 22222222222222222222"));
  });
});
