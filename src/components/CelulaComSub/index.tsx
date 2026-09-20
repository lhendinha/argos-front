import { Box, Table, Text } from "@chakra-ui/react";
import type { CelulaComSubProps } from "./types";

/** Célula de duas linhas: o valor e um detalhe menor embaixo.
 *
 * ⚠️ O peso padrão é o do corpo (400). No artifact `.tbl td` não declara
 * peso nenhum -- só `.proc-num` é 700. Emitir 600 em toda célula deixava a
 * tabela inteira parecendo negrito.
 *
 * Medidas do artifact: `.tbl td` 13px 14px com divisória em `line-soft`,
 * `.cell-sub` 12px em `slate-2` com 2px de respiro.
 *
 * 🔴 **O identificador de processo escreve nos 13px da célula, e não nos
 * 12,5px que o `.proc-num` do artifact pedia.** Era a única das sete tabelas
 * com corpo próprio. Medi a altura do "x" nas três combinações: Manrope
 * 13/700 dá 7,02px, IBM Plex Mono 13/700 dá 7,11px e a mesma mono em 12,5
 * dá 6,84px. Ou seja, os 12,5px não compensavam a mono ser mais larga --
 * eles deixavam o número 2,6% MENOR que o texto ao lado, e é ele que
 * identifica a linha. Custa +7,5px por número, que é por que os limiares de
 * `processos` e `previaDaImportacao` foram remedidos junto.
 *
 * ⚠️ **A linha de apoio TRUNCA.** Ela recebe nome de cadastro (contraparte,
 * cliente), e nome de empresa é longo: medido, "Construtora Alfa
 * Empreendimentos Imobiliários e Participações Societárias do Brasil Ltda ME"
 * levou a tabela de lançamentos a 1278px dentro de 1130px visíveis. Quem
 * corta de verdade é o `maxLargura`; o `truncate` sozinho não morde.
 */
export default function CelulaComSub({
  principal,
  sub,
  variante = "padrao",
  largura,
  maxLargura,
}: CelulaComSubProps) {
  const processo = variante === "processo";
  const forte = processo || variante === "destaque";
  return (
    <Table.Cell
      w={largura}
      maxW={maxLargura}
      verticalAlign="top"
      p="13px 14px"
      borderBottomWidth="1px"
      borderBottomColor="border.subtle"
      fontSize="13px"
      fontWeight="400"
    >
      <Box
        fontFamily={processo ? "mono" : undefined}
        fontWeight={forte ? "700" : undefined}
        color="fg"
        truncate={Boolean(maxLargura)}
      >
        {principal}
      </Box>
      {sub ? (
        <Text
          fontSize="12px"
          fontFamily={processo ? "mono" : undefined}
          color="fg.subtle"
          mt="2px"
          /* ⚠️ Sempre: uma linha de apoio que estoura a coluna é defeito em
             qualquer tela. Sem `maxLargura` isto é inócuo -- a coluna cresce
             e o texto nunca chega à borda --, e com ele é o que corta. */
          truncate
        >
          {sub}
        </Text>
      ) : null}
    </Table.Cell>
  );
}
