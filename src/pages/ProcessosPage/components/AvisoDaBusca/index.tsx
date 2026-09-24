import { Flex, Spinner, Text } from "@chakra-ui/react";

import { concordar } from "../../../../utils/importacao";
import type { AvisoDaBuscaProps } from "./types";

/** "Buscando no PJe…", no topo da prévia que vai se enchendo.
 *
 * ⚠️ Sem contagem de páginas ("4 de 7"): o total do PJe nem sempre vem, e a
 * pessoa só precisa saber que está andando -- decisão do usuário.
 */
export default function AvisoDaBusca({ encontrados }: AvisoDaBuscaProps) {
  return (
    <Flex role="status" aria-live="polite" alignItems="baseline" gap="8px" mb="14px" flexWrap="wrap">
      <Spinner size="xs" alignSelf="center" color="fg.brand" />
      <Text fontSize="14px" fontWeight="800">
        Buscando no PJe…
      </Text>
      <Text fontSize="12.5px" color="fg.muted">
        {encontrados === 0
          ? "os processos aparecem aqui conforme o tribunal responde"
          : concordar(encontrados, "1 processo encontrado até agora", `${encontrados} processos encontrados até agora`)}
      </Text>
    </Flex>
  );
}
