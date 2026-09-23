import { Box, Flex, Text } from "@chakra-ui/react";

import { mascararNumeroProcesso } from "../../../../utils";
import { concordar } from "../../../../utils/importacao";
import type { BuscaEmAndamentoProps } from "./types";

/** "Buscando…", com os processos aparecendo conforme o PJe responde.
 *
 * 🔴 **Só leitura, de propósito.** A lista ainda muda -- cada página atualiza a
 * contagem e o apelido do processo que ela tocou --, então marcar aqui seria
 * marcar uma linha que ainda vai mudar. A escolha acontece na prévia, que
 * aparece inteira quando a busca termina.
 * ⚠️ Sem contagem de páginas ("4 de 7"): o total do PJe nem sempre vem, e a
 * pessoa só precisa saber que está andando -- decisão do usuário.
 */
export default function BuscaEmAndamento({ processos }: BuscaEmAndamentoProps) {
  const n = processos.length;
  return (
    <Box mt="16px" role="status" aria-live="polite">
      <Flex alignItems="baseline" gap="8px" mb="8px" flexWrap="wrap">
        <Text fontSize="14px" fontWeight="800">
          Buscando no PJe…
        </Text>
        <Text fontSize="12.5px" color="fg.muted">
          {n === 0
            ? "os processos aparecem aqui conforme o tribunal responde"
            : concordar(n, "1 processo encontrado até agora", `${n} processos encontrados até agora`)}
        </Text>
      </Flex>
      {n > 0 && (
        <Box
          maxH="280px"
          overflowY="auto"
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
        >
          {processos.map((p) => (
            <Flex
              key={p.numero_processo}
              px="14px"
              py="8px"
              gap="10px"
              alignItems="baseline"
              borderBottom="1px solid"
              borderColor="border"
              _last={{ borderBottom: "none" }}
            >
              <Box minW="0" flex="1">
                <Text fontSize="13px" fontWeight="600" truncate>
                  {p.apelido}
                </Text>
                <Text fontSize="12px" color="fg.muted" className="num">
                  {mascararNumeroProcesso(p.numero_processo)}
                </Text>
              </Box>
              <Text fontSize="12px" color="fg.muted" flexShrink={0}>
                {p.tribunal || "—"}
              </Text>
            </Flex>
          ))}
        </Box>
      )}
    </Box>
  );
}
