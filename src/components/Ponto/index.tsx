import { Box } from "@chakra-ui/react";
import { CORES_DO_PONTO } from "../../theme/ponto";
import type { PontoProps } from "./types";

/** A bolinha que abre um item de lista (o "•" do artifact).
 *
 * Um componente porque são quatro listas com a mesma bolinha --
 * movimentações, tarefas vinculadas, processos do cliente e histórico -- e
 * já houve um pedido explícito pra que todas tivessem o mesmo tamanho.
 * Quatro cópias de `9px` divergem no primeiro ajuste.
 */
export default function Ponto({ tom = "marca", noTopo, vazado }: PontoProps) {
  return (
    <Box
      aria-hidden="true"
      w="9px"
      h="9px"
      mt={noTopo ? "6px" : undefined}
      flex="0 0 auto"
      borderRadius="full"
      bg={vazado ? "transparent" : CORES_DO_PONTO[tom]}
      /* O anel é o LIDO do Histórico: a mesma cor do tom, só o contorno, e mais apagado -- o não lido é que chama. */
      boxShadow={vazado ? `inset 0 0 0 2px {colors.${CORES_DO_PONTO[tom]}}` : undefined}
      opacity={vazado ? 0.55 : undefined}
    />
  );
}
