import { Table } from "@chakra-ui/react";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderComProviders } from "../../../../test/queryTestUtils";
import LinhaDeLancamento from ".";
import type { Lancamento } from "../../../../types";

const DESPESA = {
  lancamento_id: "d1", tipo: "saida", descricao: "Diligência do oficial", valor_centavos: 9500,
  data_vencimento: "2026-09-02", data_efetivacao: "2026-09-03", situacao: "efetivado", natureza: "saida",
  conta_id: "c1", categoria_id: "cat1", centro_id: "", rateio: [], cliente_id: "cli1", contraparte: "",
  cliente_nome: "Construtora Alfa", subgrupo_id: "", numero_processo: "", atendimento_id: "", responsavel: "",
  documento_numero: "", parcela: "", criado_por: "x", criado_em: "2026-09-01T00:00:00Z",
} as Lancamento;

function montar(lancamento: Lancamento) {
  return renderComProviders(
    <Table.Root>
      <Table.Body>
        <LinhaDeLancamento lancamento={lancamento} categoriaNome="Custas" contaNome="Itaú" onAbrir={vi.fn()} />
      </Table.Body>
    </Table.Root>,
  );
}

describe("a etiqueta 'Não cobrar' na lista", () => {
  it("🔴 aparece ao lado da situação, que continua 'Efetivado'", () => {
    montar({ ...DESPESA, nao_cobrar_em: "2026-09-05", nao_cobrar_por: "ana@x.com" });
    expect(screen.getByText("Não cobrar")).toBeInTheDocument();
    expect(screen.getByText("Efetivado")).toBeInTheDocument();
  });

  it("não aparece na despesa cobrável -- o par negativo", () => {
    montar(DESPESA);
    expect(screen.queryByText("Não cobrar")).not.toBeInTheDocument();
  });
});
