import { afterEach, describe, expect, it, vi } from "vitest";

import { CHAVE_DA_IMPORTACAO_GUARDADA } from "../constants";
import { esquecerImportacao, guardarImportacao, lerImportacaoGuardada } from "./importacaoGuardada";

const EU = "eu@escritorio.com";

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe("a importação guardada na aba", () => {
  it("volta como foi guardada, para a mesma pessoa", () => {
    guardarImportacao({ email: EU, subgrupoId: "s-1", busca: "t-1", gravacao: "g-1" });
    expect(lerImportacaoGuardada(EU)).toEqual({ email: EU, subgrupoId: "s-1", busca: "t-1", gravacao: "g-1" });
  });

  it("🔴 de outra pessoa, ou sem e-mail, não volta", () => {
    guardarImportacao({ email: EU, subgrupoId: "s-1", busca: "t-1" });
    expect(lerImportacaoGuardada("outra@escritorio.com")).toBeNull();
    expect(lerImportacaoGuardada("")).toBeNull();
  });

  it("⚠️ valor de outra versão da tela (ou quebrado) é ignorado, e não derruba nada", () => {
    sessionStorage.setItem(CHAVE_DA_IMPORTACAO_GUARDADA, "{não é json");
    expect(lerImportacaoGuardada(EU)).toBeNull();
    sessionStorage.setItem(CHAVE_DA_IMPORTACAO_GUARDADA, JSON.stringify({ email: EU, busca: 42 }));
    expect(lerImportacaoGuardada(EU)).toBeNull();
  });

  it("esquecer apaga", () => {
    guardarImportacao({ email: EU, subgrupoId: "s-1", busca: "t-1" });
    esquecerImportacao();
    expect(lerImportacaoGuardada(EU)).toBeNull();
  });

  it("⚠️ sem armazenamento (aba privada, dado bloqueado), nada lança", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(() => guardarImportacao({ email: EU, subgrupoId: "s-1", busca: "t-1" })).not.toThrow();
    expect(lerImportacaoGuardada(EU)).toBeNull();
    expect(() => esquecerImportacao()).not.toThrow();
  });
});
