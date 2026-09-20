import { Box } from "@chakra-ui/react";

import { Tabela } from "../../../../components";
import { LARGURA_MINIMA_DA_TABELA } from "../../../../constants";
import { useLarguraEstreita } from "../../../../hooks/useLarguraEstreita";
import { COLUNAS_DE_DOCUMENTOS } from "../../constants";
import ItemDeDocumento from "../ItemDeDocumento";
import LinhaDeDocumento from "../LinhaDeDocumento";
import type { Documento } from "../../../../types";
import type { ListaDeDocumentosProps } from "./types";

/** Os documentos como TABELA onde cabem as seis colunas, e como ITENS de
 * várias linhas onde não cabem. Ver `TabelaProcessos`, que estabeleceu o
 * padrão.
 *
 * ⚠️ Nasceu ao extrair a tabela de dentro de `DocumentosPage`: ela era a
 * única das cinco listas montada direto na página, e a escolha entre duas
 * árvores não cabe no meio de uma tela que já trata erro, busca e
 * paginação. */
export default function ListaDeDocumentos({
  documentos,
  subgrupoNome,
  onAbrir,
  vazio,
}: ListaDeDocumentosProps) {
  const [medir, estreita] = useLarguraEstreita(LARGURA_MINIMA_DA_TABELA.documentos);
  const chave = (d: Documento) => `${d.subgrupo_id}:${d.documento_id}`;

  return (
    <Box ref={medir}>
      {estreita ? (
        vazio || (
          <Box px="6px">
            {documentos.map((d) => (
              <ItemDeDocumento key={chave(d)} documento={d} subgrupoNome={subgrupoNome} onAbrir={onAbrir} />
            ))}
          </Box>
        )
      ) : (
        <Tabela colunas={COLUNAS_DE_DOCUMENTOS} vazio={vazio}>
          {documentos.map((d) => (
            <LinhaDeDocumento key={chave(d)} documento={d} subgrupoNome={subgrupoNome} onAbrir={onAbrir} />
          ))}
        </Tabela>
      )}
    </Box>
  );
}
