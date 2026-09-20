import { Box } from "@chakra-ui/react";

import { EstadoVazio, Tabela } from "../../../../components";
import { LIMIAR_DA_LISTA_EM_ITENS } from "../../../../constants";
import { useLarguraEstreita } from "../../../../hooks/useLarguraEstreita";
import { COLUNAS_MEMBROS, COLUNA_DE_ACOES } from "../../constants";
import ItemDeMembro from "../ItemDeMembro";
import LinhaDeMembro from "../LinhaDeMembro";
import type { TabelaDeMembrosProps } from "./types";

/** As pessoas do grupo como TABELA onde cabem as cinco colunas, e como ITENS
 * onde não cabem.
 *
 * ⚠️ Medida em 360px, com dez pessoas no grupo: a tabela pedia 691px num
 * visível de 318. Com três pessoas eram 605 -- a coluna de subgrupos cresce
 * com o grupo, e medir com dado ralo subestima.
 */
export default function TabelaDeMembros({ membros, podeEditar, onEditar }: TabelaDeMembrosProps) {
  const [medir, estreita] = useLarguraEstreita(LIMIAR_DA_LISTA_EM_ITENS);

  const vazio = membros.length === 0 && (
    <EstadoVazio mensagem="Nenhuma pessoa neste grupo ainda." />
  );

  /* 🔴 `subgrupo_nomes` vem NA PESSOA, resolvido pelo servidor pra página
     pedida. Antes a tela baixava o catálogo inteiro de subgrupos só pra
     traduzir id em nome -- e enquanto ele não chegava, a coluna ficava VAZIA
     (o `.filter(Boolean)` descartava os ids não encontrados), sugerindo que a
     pessoa não está em subgrupo nenhum. */
  const comuns = (m: (typeof membros)[number]) => ({
    membro: m,
    subgruposNomes: m.subgrupo_nomes || [],
    podeEditar,
    onEditar,
  });

  return (
    <Box ref={medir}>
      {estreita ? (
        vazio || (
          <Box px="6px">
            {membros.map((m) => (
              <ItemDeMembro key={m.email} {...comuns(m)} />
            ))}
          </Box>
        )
      ) : (
        <Tabela
          colunas={podeEditar ? [...COLUNAS_MEMBROS, COLUNA_DE_ACOES] : COLUNAS_MEMBROS}
          vazio={vazio}
        >
          {membros.map((m) => (
            <LinhaDeMembro key={m.email} {...comuns(m)} />
          ))}
        </Tabela>
      )}
    </Box>
  );
}
