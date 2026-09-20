import { Etiqueta, EtiquetasDeSubgrupo, ItemDeLista } from "../../../../components";
import { formatarData, mascararNumeroProcesso } from "../../../../utils";
import { CORES_DA_ETIQUETA_DE_NOME, CORES_DO_PRAZO } from "../../../../theme/lista";
import type { ItemDeProcessoProps } from "./types";

/** A linha de Processos onde não cabem colunas.
 *
 * 🔴 **O apelido é o identificador; o número desce para o apoio.** Quem abre
 * a lista no celular quer saber QUAL processo é -- e, quando o apelido não
 * existe, o número sobe e ocupa o lugar dele, em monoespaçada. Não há item
 * sem identificador.
 *
 * ⚠️ Sem `children`: o desenho inteiro vem do `ItemDeLista`. Esta função
 * escolhe o que vai em cada compartimento, e nada mais.
 */
export default function ItemDeProcesso({
  processo: p,
  subgrupoNome,
  clientesNomes,
  situacaoRotulo,
  onAbrir,
}: ItemDeProcessoProps) {
  const numero = mascararNumeroProcesso(p.numero_processo);
  const clientes = clientesNomes(p);
  const situacao = situacaoRotulo(p.situacao_id);

  return (
    <ItemDeLista
      onAbrir={() => onAbrir(p)}
      rotulo={p.apelido || numero}
      identificador={p.apelido || numero}
      identificadorMono={!p.apelido}
      apoio={p.apelido ? numero : undefined}
      apoioMono
      etiquetas={
        <>
          {clientes && (
            <Etiqueta cores={CORES_DA_ETIQUETA_DE_NOME} variante="nome">
              {clientes}
            </Etiqueta>
          )}
          <EtiquetasDeSubgrupo nomes={[subgrupoNome(p.subgrupo_id)]} />
        </>
      }
      rodape={{
        texto: situacao || "Sem situação",
        destaque: p.prazo_final ? (
          <Etiqueta cores={CORES_DO_PRAZO}>{formatarData(p.prazo_final)}</Etiqueta>
        ) : undefined,
      }}
    />
  );
}
