import { Text } from "@chakra-ui/react";

import { rotuloDaVerificacao } from "../../utils";
import type { VerificacaoDoProcessoProps } from "./types";

/** "verificado até 26/09", e "(atrasado)" em amarelo quando o servidor diz que a verificação parou.
 *
 * ⚠️ `status.warn.text`, e não `status.warn`: o texto é pequeno, e a cor clara não passa no contraste
 * (`theme/contraste.test.ts`). O resto herda a cor de quem o envolve -- a linha de baixo da célula, ou o
 * texto discreto do detalhe.
 * ➡️ `src/components/VerificacaoDoProcesso/index.test.tsx`.
 */
export default function VerificacaoDoProcesso({ processo, inicioDeFrase = false }: VerificacaoDoProcessoProps) {
  const { texto, atrasada } = rotuloDaVerificacao(processo);
  return (
    <>
      {inicioDeFrase ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto}
      {atrasada && (
        <Text as="span" color="status.warn.text" fontWeight={700}>
          {" (atrasado)"}
        </Text>
      )}
    </>
  );
}
