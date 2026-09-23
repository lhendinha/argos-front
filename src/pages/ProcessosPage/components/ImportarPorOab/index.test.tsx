import { act, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../services/api", () => ({
  listarMembrosDoSubgrupo: vi.fn().mockResolvedValue({ membros: [] }),
  buscarProcessosPorOab: vi.fn(),
  importarProcessos: vi.fn(),
  lerBusca: vi.fn(),
}));

import { renderComProviders } from "../../../../test/queryTestUtils";
import ImportarPorOab from "./index";

const CIVEL = { subgrupo_id: "s-civel", nome: "Cível" };

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
