import { describe, expect, it } from "vitest";

import { LEITURA_LIDOS, LEITURA_NAO_LIDOS } from "../../constants";
import { comEnvioLido, contagensDoFiltroDeLeitura } from "./leitura";
import type { RespostaDeHistoricoPaginada } from "../../types/respostas";

const envio = (sequencia: number, lido: boolean) => ({ numero_processo: `p${sequencia}`, enviado_em: "t", sequencia, lido });

function pagina(): RespostaDeHistoricoPaginada {
  return {
    historico: [envio(3, false), envio(2, true), envio(1, false)],
    total: 3,
    total_paginas: 1,
    contagens_da_leitura: { total: 3, [LEITURA_NAO_LIDOS]: 2, [LEITURA_LIDOS]: 1 },
  } as RespostaDeHistoricoPaginada;
}

describe("o envio marcado como lido no cache", () => {
  it("vira lido, e as contagens trocam um de lugar -- o total fica", () => {
    const depois = comEnvioLido(pagina(), 1);
    expect(depois?.historico.map((i) => [i.sequencia, i.lido])).toEqual([[3, false], [2, true], [1, true]]);
    expect(depois?.contagens_da_leitura).toEqual({ total: 3, [LEITURA_NAO_LIDOS]: 1, [LEITURA_LIDOS]: 2 });
    expect(depois?.total).toBe(3);
  });

  it("não muda a página de origem", () => {
    const antes = pagina();
    comEnvioLido(antes, 3);
    expect(antes.historico[0].lido).toBe(false);
    expect(antes.contagens_da_leitura?.[LEITURA_NAO_LIDOS]).toBe(2);
  });

  it.each([
    ["o envio já lido", 2],
    ["a sequência que não está na página", 99],
  ])("🔴 %s devolve a MESMA página -- sem descontar duas vezes", (_caso, sequencia) => {
    const antes = pagina();
    expect(comEnvioLido(antes, sequencia)).toBe(antes);
  });

  it("sem página no cache, nada a fazer", () => {
    expect(comEnvioLido(undefined, 1)).toBeUndefined();
  });

  it("⚠️ a leitura antiga não traz contagens: o envio vira lido e elas continuam ausentes", () => {
    const antiga = { ...pagina(), contagens_da_leitura: undefined };
    const depois = comEnvioLido(antiga, 3);
    expect(depois?.historico[0].lido).toBe(true);
    expect(depois?.contagens_da_leitura).toBeUndefined();
  });
});

describe("as contagens no formato do menu do filtro", () => {
  it("cada opção pelo seu id: o total é o de 'Lidos e não lidos'", () => {
    expect(contagensDoFiltroDeLeitura({ total: 5, [LEITURA_NAO_LIDOS]: 3, [LEITURA_LIDOS]: 2 })).toEqual({
      todos: 5,
      [LEITURA_NAO_LIDOS]: 3,
      [LEITURA_LIDOS]: 2,
    });
  });

  it("⚠️ sem contagens (leitura antiga), nada -- e não um menu de zeros", () => {
    expect(contagensDoFiltroDeLeitura(undefined)).toBeUndefined();
  });
});
