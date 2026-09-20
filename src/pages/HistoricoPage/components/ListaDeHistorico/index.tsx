import { Box } from "@chakra-ui/react";

import { Tabela } from "../../../../components";
import { LARGURA_MINIMA_DA_TABELA } from "../../../../constants";
import { useLarguraEstreita } from "../../../../hooks/useLarguraEstreita";
import { COLUNAS_DO_HISTORICO } from "../../constants";
import ItemDeHistorico from "../ItemDeHistorico";
import LinhaDeHistorico from "../LinhaDeHistorico";
import type { ListaDeHistoricoProps } from "./types";

/** Os envios como TABELA onde cabem as cinco colunas, e como ITENS de várias
 * linhas onde não cabem.
 *
 * 🔴 **Esta era a segunda das duas telas fora da regra.** Junto com
 * Atendimentos, era uma lista de itens no meio de sete tabelas -- e a única
 * cuja linha fingia ser botão, com `role`, `tabIndex` e teclas escritos à
 * mão dentro de uma lista que não era tabela.
 *
 * ⚠️ Sem estado vazio aqui: a página já decide entre vazio e lista antes de
 * chegar neste componente, e trazer a decisão para cá criaria a segunda
 * cópia da distinção entre "vazio por filtro" e "vazio de verdade".
 */
export default function ListaDeHistorico({
  historico,
  subgruposVisiveis,
  onAbrir,
}: ListaDeHistoricoProps) {
  const [medir, estreita] = useLarguraEstreita(LARGURA_MINIMA_DA_TABELA.historico);
  const comuns = { subgruposVisiveis, onAbrir };
  const chave = (h: (typeof historico)[number], i: number) =>
    `${h.numero_processo}-${h.enviado_em}-${i}`;

  return (
    <Box ref={medir}>
      {estreita ? (
        <Box px="6px">
          {historico.map((h, i) => (
            <ItemDeHistorico key={chave(h, i)} item={h} {...comuns} />
          ))}
        </Box>
      ) : (
        <Tabela colunas={COLUNAS_DO_HISTORICO}>
          {historico.map((h, i) => (
            <LinhaDeHistorico key={chave(h, i)} item={h} {...comuns} />
          ))}
        </Tabela>
      )}
    </Box>
  );
}
