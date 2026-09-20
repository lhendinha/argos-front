import { Table, Text } from "@chakra-ui/react";

import { CelulaComSub, EtiquetasDeSubgrupo } from "../../../../components";
import { rotuloDoTipo } from "../../../../constants";
import { formatarDataDeInstante, vinculoDoDocumento } from "../../../../utils";
import type { LinhaDeDocumentoProps } from "./types";

/** Uma linha da tabela de documentos.
 *
 * A linha inteira é clicável e leva à tela do documento -- não há lixeira nem
 * lápis aqui. É o mesmo arranjo de Processos e Clientes: as ações vivem no
 * detalhe, e por isso a linha precisa ser alcançável pelo teclado
 * (`tabIndex` + Enter/Espaço). Sem isso, quem navega por Tab não teria
 * caminho nenhum pra abrir um documento.
 */
export default function LinhaDeDocumento({ documento, subgrupoNome, onAbrir }: LinhaDeDocumentoProps) {
  const vinculo = vinculoDoDocumento(documento);

  return (
    <Table.Row
      tabIndex={0}
      cursor="pointer"
      _hover={{ bg: "bg.canvas" }}
      /* Última linha sem divisória: a borda do cartão já fecha a tabela. */
      _last={{ "& td": { borderBottomWidth: 0 } }}
      _focusVisible={{ outline: "2px solid", outlineColor: "fg.brand", outlineOffset: "-2px" }}
      onClick={() => onAbrir(documento)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAbrir(documento);
        }
      }}
    >
      <CelulaComSub
        variante="destaque"
        principal={documento.titulo}
        sub={documento.descricao || undefined}
      />
      {/* O rótulo cru pro tipo que esta versão não conhece -- ver
          `rotuloDoTipo`. Sumir com a linha seria esconder documento que
          existe. */}
      <CelulaComSub principal={rotuloDoTipo(documento.tipo)} />
      <CelulaComSub
        principal={
          !vinculo.principal ? (
            <Text as="span" color="fg.subtle">
              —
            </Text>
          ) : (
            vinculo.principal
          )
        }
        sub={vinculo.sub}
      />
      {/* ⚠️ Lista de UM: documento pertence a um subgrupo só. O resumo por
          contagem de `EtiquetasDeSubgrupo` não chega a aparecer aqui -- ele
          existe para Membros, Inscrições e Histórico, onde a lista é lista. */}
      <CelulaComSub principal={<EtiquetasDeSubgrupo nomes={[subgrupoNome(documento.subgrupo_id)]} />} />
      <CelulaComSub
        principal={
          documento.responsavel_nome ||
          documento.responsavel_id || (
            <Text as="span" color="fg.subtle">
              —
            </Text>
          )
        }
      />
      <CelulaComSub principal={formatarDataDeInstante(documento.criado_em)} />
    </Table.Row>
  );
}
