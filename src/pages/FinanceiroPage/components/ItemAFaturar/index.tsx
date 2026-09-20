import { ItemDeLista } from "../../../../components";
import { contar, formatarCentavos, formatarData } from "../../../../utils";
import type { ItemAFaturarProps } from "./types";

/** O cliente com coisas a faturar, onde não cabem as quatro colunas.
 *
 * 🔴 **Três números por linha contra UM compartimento de valor.** Honorários,
 * despesas e total disputam o mesmo lugar, e a escolha não é de espaço: o
 * TOTAL é o número sobre o qual se age -- é ele que vira fatura. Ele fica no
 * valor; os outros dois descem para o rodapé, com rótulo, porque sem rótulo
 * dois números soltos lado a lado não dizem qual é qual.
 *
 * ⚠️ Na tabela os três são colunas com cabeçalho, e é o cabeçalho que os
 * nomeia. No item não há cabeçalho -- por isso o rodapé escreve "Honorários"
 * e "Despesas" por extenso.
 */
export default function ItemAFaturar({ cliente: c, onEmitir }: ItemAFaturarProps) {
  return (
    <ItemDeLista
      onAbrir={() => onEmitir(c)}
      rotulo={`Emitir fatura para ${c.cliente_nome}`}
      identificador={c.cliente_nome}
      apoio={`${contar(c.quantidade, "lançamento", "lançamentos")} · o mais antigo de ${formatarData(c.mais_antigo)}`}
      valor={{ texto: `R$ ${formatarCentavos(c.total_centavos)}` }}
      rodape={{
        texto: `Honorários R$ ${formatarCentavos(c.honorarios_centavos)}`,
        destaque: `Despesas R$ ${formatarCentavos(c.despesas_centavos)}`,
      }}
    />
  );
}
