import { useQuery } from "@tanstack/react-query";

import { teorDaMovimentacao } from "../../../services";
import { qk } from "../../../services/queryKeys";
import type { Comunicacao } from "../../../types";

/** O TEOR de UMA movimentação, buscado só quando ela é aberta.
 *
 * 🔴 A lista do detalhe mostra tipo, data e órgão -- o teor nunca aparece
 * nela. Enquanto ele vinha junto da lista, abrir a tela carregava o texto de
 * TODAS as movimentações para mostrar nenhuma: medido em produção, o texto é
 * 80% do peso de cada uma, e o processo mais movimentado do escritório
 * trazia 100 KB onde 6 KB bastam.
 *
 * ⚠️ **Sem `enabled`, e isso foi medido**: o hook vive dentro do modal, que
 * só monta quando há movimentação ABERTA -- o id nunca chega vazio aqui.
 * Uma guarda `enabled` ficou escrita e a mutação que a apagava SOBREVIVEU,
 * porque não há caminho que a exercite. Guarda que nada alcança não protege;
 * só faz parecer que alguém pensou no caso.
 *
 * ⚠️ Sem `staleTime`: o teor de uma publicação não muda, mas o cache padrão
 * do React Query já evita a segunda ida ao abrir a mesma movimentação de
 * novo. Um tempo aqui só adiaria o dia em que uma correção do tribunal
 * demorasse a aparecer.
 */
export function useTeorDaMovimentacao(numeroProcesso: string, comunicacaoId: number | string) {
  return useQuery<Comunicacao>({
    /* 🔴 O id NA CHAVE. Sem ele, abrir uma movimentação e depois outra
       serviria o teor da primeira para a segunda -- texto errado, sem erro
       nenhum. Achado por mutação sobrevivente. */
    queryKey: qk.teorDaMovimentacao(numeroProcesso, comunicacaoId),
    queryFn: () => teorDaMovimentacao(numeroProcesso, comunicacaoId),
  });
}
