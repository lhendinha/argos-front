import {
  BotaoQuadrado,
  EtiquetaDePapel,
  EtiquetasDeSubgrupo,
  IconeLapis,
  ItemDeLista,
} from "../../../../components";
import type { ItemDeMembroProps } from "./types";

/** A pessoa do grupo onde não cabem as cinco colunas.
 *
 * ⚠️ **Sem rodapé.** O desenho da proposta mostrava uma linha de OAB, e o
 * `Membro` da LISTA não carrega esse campo -- número e UF só existem no
 * `MembroEditavel`, que é o que o modal de edição pede. Inventar a linha
 * seria desenhar dado que a tela não tem.
 *
 * ⚠️ O e-mail só vira apoio quando há apelido: sem ele o e-mail JÁ é o
 * identificador, e repeti-lo embaixo seria a mesma linha duas vezes.
 */
export default function ItemDeMembro({
  membro,
  subgruposNomes,
  podeEditar,
  onEditar,
}: ItemDeMembroProps) {
  const nome = membro.apelido || membro.email;

  return (
    <ItemDeLista
      onAbrir={() => podeEditar && onEditar(membro)}
      rotulo={podeEditar ? `Editar ${nome}` : nome}
      identificador={nome}
      apoio={membro.apelido ? membro.email : undefined}
      etiquetas={
        <>
          {membro.papel && <EtiquetaDePapel papel={membro.papel} />}
          <EtiquetasDeSubgrupo nomes={subgruposNomes} />
        </>
      }
      acoes={
        podeEditar ? (
          <BotaoQuadrado
            type="button"
            title="Editar"
            aria-label={`Editar ${nome}`}
            /* O item inteiro já abre a edição -- sem isto, o toque no botão
               dispararia as duas coisas. */
            onClick={(e) => {
              e.stopPropagation();
              onEditar(membro);
            }}
          >
            <IconeLapis />
          </BotaoQuadrado>
        ) : undefined
      }
    />
  );
}
