import { Etiqueta, ItemDeLista } from "../../../../components";
import { coresDaFatura } from "../../../../theme/fatura";
import {
  ROTULO_DA_FATURA,
  formatarCentavos,
  formatarData,
  situacaoDaFaturaNaTela,
} from "../../../../utils";
import type { ItemDeFaturaProps } from "./types";

/** A fatura emitida onde não cabem as seis colunas.
 *
 * 🔴 **O pagamento vira o DESTAQUE do rodapé, e some quando não existe.** Na
 * tabela ele é uma coluna que passa a maior parte do tempo com um travessão
 * -- ali o travessão é necessário, porque coluna vazia se lê como "não
 * carregou". No item não há coluna: o que não aconteceu simplesmente não
 * ocupa espaço.
 *
 * ⚠️ O número é o identificador, em monoespaçada: é por ele que se procura
 * uma fatura, e é ele que o cliente cita.
 */
export default function ItemDeFatura({ fatura: f, nomeDoCliente, onAbrir }: ItemDeFaturaProps) {
  const situacao = situacaoDaFaturaNaTela(f);

  return (
    <ItemDeLista
      onAbrir={() => onAbrir(f.fatura_id)}
      rotulo={`Fatura ${f.numero}`}
      identificador={f.numero}
      identificadorMono
      apoio={nomeDoCliente(f.cliente_id)}
      valor={{ texto: `R$ ${formatarCentavos(f.valor_total_centavos)}` }}
      etiquetas={
        <Etiqueta cores={coresDaFatura(situacao)}>
          {ROTULO_DA_FATURA[situacao] ?? situacao}
        </Etiqueta>
      }
      rodape={{
        texto: `Venc. ${formatarData(f.data_vencimento)}`,
        destaque: f.pago_em ? `Paga em ${formatarData(f.pago_em)}` : undefined,
      }}
    />
  );
}
