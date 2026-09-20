import { Botao, ItemDeLista } from "../../../../components";
import { formatarCentavos, formatarData } from "../../../../utils";
import type { ItemNaoCobradoProps } from "./types";

/** A despesa marcada como "não cobrar", onde não cabem as quatro colunas.
 *
 * 🔴 **"Voltar a cobrar" vai no DESTAQUE DO RODAPÉ, e não em `acoes`.**
 * Primeiro pus em `acoes`, ao lado do conteúdo, e olhei: o botão de texto
 * comia 140px de uma faixa de 322, e "Custas iniciais adiantadas pelo
 * escritório" quebrava em CINCO linhas. No rodapé ele divide a faixa com uma
 * data curta e o identificador recupera a largura inteira. `acoes` é para o
 * que tem tamanho de ícone -- a lixeira, o lápis, o interruptor.
 */
export default function ItemNaoCobrado({
  despesa: d,
  voltando,
  onAbrir,
  onVoltarACobrar,
}: ItemNaoCobradoProps) {
  return (
    <ItemDeLista
      onAbrir={() => onAbrir(d.lancamento_id)}
      rotulo={d.descricao}
      identificador={d.descricao}
      apoio={`${d.cliente_nome} · marcada por ${d.nao_cobrar_por_nome} em ${formatarData(d.nao_cobrar_em)}`}
      valor={{ texto: `R$ ${formatarCentavos(d.valor_centavos)}` }}
      rodape={{
        texto: `Adiantada em ${formatarData(d.data_efetivacao || d.data_vencimento)}`,
        destaque: (
          <Botao
            variante="ghost"
            disabled={voltando === d.lancamento_id}
            onClick={(e) => {
              e.stopPropagation();
              onVoltarACobrar(d);
            }}
          >
            Voltar a cobrar
          </Botao>
        ),
      }}
    />
  );
}
