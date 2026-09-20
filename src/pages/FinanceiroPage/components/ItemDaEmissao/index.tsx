import { Checkbox } from "@chakra-ui/react";

import { Botao, ItemDeLista } from "../../../../components";
import { NATUREZA_SAIDA } from "../../../../constants";
import { formatarCentavos, formatarData } from "../../../../utils";
import type { ItemDaEmissaoProps } from "./types";

/** O lançamento que vai (ou não) para a fatura, onde não cabem as colunas.
 *
 * 🔴 **A caixa vai NA FRENTE**, pelo mesmo motivo da prévia da importação: é
 * uma lista onde a pergunta é "quais destes", e a coluna alinhada é por onde
 * o polegar desce.
 *
 * ⚠️ **"Não cobrar" vai no destaque do RODAPÉ**, e não em `acoes` -- é ação
 * de texto, e `acoes` é para o que tem tamanho de ícone. A régua saiu do
 * "Voltar a cobrar" das despesas não cobradas, que espremia o identificador
 * em cinco linhas.
 *
 * ⚠️ A despesa se anuncia: ela não é cobrança, é reembolso -- e o total soma
 * o valor dela do mesmo jeito, porque é isso que o cliente devolve.
 */
export default function ItemDaEmissao({
  lancamento: l,
  incluido,
  naoCobrarEmVoo,
  onAlternar,
  onNaoCobrar,
}: ItemDaEmissaoProps) {
  const eDespesa = l.natureza === NATUREZA_SAIDA;

  return (
    <ItemDeLista
      onAbrir={onAlternar}
      rotulo={`Incluir ${l.descricao}`}
      selecao={
        <Checkbox.Root
          checked={incluido}
          onCheckedChange={onAlternar}
          aria-label={`Incluir ${l.descricao}`}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
        </Checkbox.Root>
      }
      identificador={l.descricao}
      apoio={eDespesa ? "Despesa adiantada · entra como reembolso" : undefined}
      valor={{ texto: `R$ ${formatarCentavos(l.valor_centavos)}` }}
      rodape={{
        /* ⚠️ "adiantada em" na despesa paga: é quando o ESCRITÓRIO pagou --
           "paga em" se lia como pago pelo cliente. */
        texto:
          eDespesa && l.data_efetivacao
            ? `adiantada em ${formatarData(l.data_efetivacao)}`
            : `vence ${formatarData(l.data_vencimento)}`,
        destaque: eDespesa ? (
          <Botao
            variante="ghost"
            aria-label={`Não cobrar ${l.descricao}`}
            disabled={naoCobrarEmVoo}
            onClick={(e) => {
              e.stopPropagation();
              onNaoCobrar(l);
            }}
          >
            Não cobrar
          </Botao>
        ) : undefined,
      }}
    />
  );
}
