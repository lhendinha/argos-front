import { Box } from "@chakra-ui/react";

import { Tabela } from "../../../../components";
import { LIMIAR_DA_LISTA_EM_ITENS } from "../../../../constants";
import { useLarguraEstreita } from "../../../../hooks/useLarguraEstreita";
import { COLUNAS_DE_ATENDIMENTOS } from "../../constants";
import ItemDeAtendimento from "../ItemDeAtendimento";
import LinhaDeAtendimento from "../LinhaDeAtendimento";
import type { ListaDeAtendimentosProps } from "./types";

/** Os atendimentos como TABELA onde cabem as cinco colunas, e como ITENS de
 * várias linhas onde não cabem.
 *
 * 🔴 **Esta tela não tinha as duas formas: tinha UMA, que não era nenhuma
 * das duas.** Era uma lista de itens no desktop, entre sete tabelas, e a
 * mesma lista espremida no celular. Agora segue a regra do sistema -- acima
 * do limiar, tabela; abaixo, item --, e o limiar é medido no CONTAINER, não
 * na janela: ver `useLarguraEstreita`.
 *
 * ⚠️ O estado vazio vem PRONTO da página, e é o mesmo nos dois caminhos: ele
 * distingue "vazio por filtro" de "vazio de verdade", e uma segunda cópia
 * perderia a distinção no primeiro ajuste.
 */
export default function ListaDeAtendimentos({
  atendimentos,
  vazio,
  subgrupoNome,
  onAbrir,
}: ListaDeAtendimentosProps) {
  const [medir, estreita] = useLarguraEstreita(LIMIAR_DA_LISTA_EM_ITENS);
  const comuns = { subgrupoNome, onAbrir };
  const chave = (a: (typeof atendimentos)[number]) => `${a.subgrupo_id}:${a.atendimento_id}`;

  return (
    <Box ref={medir}>
      {estreita ? (
        atendimentos.length === 0 ? (
          vazio
        ) : (
          <Box px="6px">
            {atendimentos.map((a) => (
              <ItemDeAtendimento key={chave(a)} atendimento={a} {...comuns} />
            ))}
          </Box>
        )
      ) : (
        <Tabela
          colunas={COLUNAS_DE_ATENDIMENTOS}
          vazio={atendimentos.length === 0 ? vazio : undefined}
        >
          {atendimentos.map((a) => (
            <LinhaDeAtendimento key={chave(a)} atendimento={a} {...comuns} />
          ))}
        </Tabela>
      )}
    </Box>
  );
}
