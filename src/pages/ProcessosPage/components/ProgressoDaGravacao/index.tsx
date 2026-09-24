import { Box, Progress, Text } from "@chakra-ui/react";

import type { ProgressoDaGravacaoProps } from "./types";

/** A barra da gravação em segundo plano: na prévia, e na tela recarregada no meio da gravação.
 *
 * ⚠️ Sem total (nenhum pulso ainda), a barra é indeterminada: some-la faria a
 * gravação parecer parada.
 */
export default function ProgressoDaGravacao({ progresso }: ProgressoDaGravacaoProps) {
  return (
    <Box mt="14px">
      <Progress.Root
        value={progresso?.total ? (progresso.feitos / progresso.total) * 100 : null}
        size="sm"
      >
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
      <Text fontSize="12px" color="fg.muted" mt="6px">
        {progresso ? `${progresso.feitos} de ${progresso.total} cadastrados` : "Gravando…"}
      </Text>
    </Box>
  );
}
