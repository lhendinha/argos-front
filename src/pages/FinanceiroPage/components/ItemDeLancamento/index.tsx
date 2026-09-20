import { Etiqueta, ItemDeLista } from "../../../../components";
import { CORES_DO_NAO_COBRAR, coresDaSituacao, corDoValor, sinalDoValor } from "../../../../theme/lancamento";
import { formatarCentavos, formatarData } from "../../../../utils";
import { ROTULO_DA_SITUACAO } from "../../constants";
import type { ItemDeLancamentoProps } from "./types";

/** A linha de Lançamentos onde não cabem colunas.
 *
 * 🔴 **O valor sobe para a primeira linha.** Na tabela ele é a última coluna
 * porque o olho desce uma coluna de números comparáveis -- aqui não há
 * coluna, e o número é o que se procura.
 *
 * 🔴 **O vencimento vai para o DESTAQUE do rodapé**, e não para o meio das
 * etiquetas. Ali ele era texto solto entre duas pílulas: não se lia como
 * data nem como etiqueta.
 */
export default function ItemDeLancamento({
  lancamento: l,
  categoriaNome,
  contaNome,
  onAbrir,
}: ItemDeLancamentoProps) {
  const pedaco = l.valor_no_departamento_centavos;
  const mostrarTotal = pedaco !== undefined && pedaco !== l.valor_centavos;

  return (
    <ItemDeLista
      onAbrir={onAbrir}
      rotulo={l.descricao}
      identificador={l.descricao}
      apoio={l.contraparte || l.cliente_nome || undefined}
      valor={{
        texto: `${sinalDoValor(l.natureza)} R$ ${formatarCentavos(pedaco ?? l.valor_centavos)}`,
        cor: corDoValor(l.natureza),
        sub: mostrarTotal ? `de R$ ${formatarCentavos(l.valor_centavos)}` : undefined,
      }}
      etiquetas={
        <>
          <Etiqueta cores={coresDaSituacao(l.situacao)}>
            {ROTULO_DA_SITUACAO[l.situacao] ?? l.situacao}
          </Etiqueta>
          {Boolean(l.nao_cobrar_em) && <Etiqueta cores={CORES_DO_NAO_COBRAR}>Não cobrar</Etiqueta>}
        </>
      }
      rodape={{
        texto: [categoriaNome, contaNome].filter(Boolean).join(" · "),
        destaque: `Venc. ${formatarData(l.data_vencimento)}`,
      }}
    />
  );
}
