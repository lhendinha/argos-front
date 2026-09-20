import { Etiqueta, EtiquetasDeSubgrupo, ItemDeLista } from "../../../../components";
import { rotuloDoTipo } from "../../../../constants";
import { formatarDataDeInstante, vinculoDoDocumento } from "../../../../utils";
import { CORES_DA_ETIQUETA_DE_NOME } from "../../../../theme/lista";
import type { ItemDeDocumentoProps } from "./types";

/** A linha de Documentos onde não cabem colunas.
 *
 * 🔴 **O apoio é o VÍNCULO, não a descrição.** Foram desenhadas as duas e
 * medido o rodapé: ele tem 322px, e o número do processo mais um nome
 * completo pedem 354 -- com a descrição em cima, o vínculo desce e corta
 * (`5000434-96.2024.8.13.0…`). E a pergunta de quem varre a lista é de que
 * processo o documento é; a descrição é texto livre, e aparece ao abrir.
 */
export default function ItemDeDocumento({ documento, subgrupoNome, onAbrir }: ItemDeDocumentoProps) {
  const vinculo = vinculoDoDocumento(documento);
  const frase = [vinculo.principal, vinculo.sub].filter(Boolean).join(" · ");
  const responsavel = documento.responsavel_nome || documento.responsavel_id;

  return (
    <ItemDeLista
      onAbrir={() => onAbrir(documento)}
      rotulo={documento.titulo}
      identificador={documento.titulo}
      apoio={frase || undefined}
      apoioMono={Boolean(documento.processo_numero)}
      etiquetas={
        <>
          <Etiqueta cores={CORES_DA_ETIQUETA_DE_NOME} variante="nome">
            {rotuloDoTipo(documento.tipo)}
          </Etiqueta>
          <EtiquetasDeSubgrupo nomes={[subgrupoNome(documento.subgrupo_id)]} />
        </>
      }
      rodape={{
        texto: [responsavel || "Sem responsável", formatarDataDeInstante(documento.criado_em)].join(" · "),
      }}
    />
  );
}
