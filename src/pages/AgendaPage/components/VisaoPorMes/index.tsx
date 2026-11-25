import { Box, Flex, Grid, Text } from "@chakra-ui/react";

import { BotaoNu } from "../../../../components";

import { CORES_DA_PRIORIDADE, TELA_SEM_ESPACO_PARA_O_MES } from "../../../../constants";
import { DIAS_DA_SEMANA_CURTOS, PONTOS_POR_CELULA } from "../../constants";
import { gradeDoMes } from "../../../../utils/calendario";
import type { VisaoPorMesProps } from "./types";

/** Quantos títulos cabem numa célula antes do "+N mais". */
const TITULOS_POR_CELULA = 2;

/** A grade do mês (`.month-grid` do artifact): 7 colunas × 6 semanas.
 *
 * Reaproveita `gradeDoMes`, a mesma função do calendário do `SeletorData` --
 * seis semanas fixas e os dias de fora do mês marcados em vez de omitidos.
 * Duas grades independentes começariam a semana em dias diferentes no
 * primeiro ajuste.
 *
 * A célula mostra PONTOS, não títulos: no mês inteiro não há largura pra
 * texto, e o ponto responde a "tem coisa nesse dia?", que é a pergunta que
 * a visão mensal existe pra responder. O detalhe vem clicando no dia.
 *
 * O fundo da grade é a própria borda: `gap: 1px` sobre `bg="border"` desenha
 * as divisórias sem 42 bordas que se somam em dobro nos encontros.
 */
export default function VisaoPorMes({
  data,
  isoDeHoje,
  isoSelecionado,
  porDia,
  onEscolherDia,
}: VisaoPorMesProps) {
  const grade = gradeDoMes(data.getFullYear(), data.getMonth());

  return (
    <Grid
      templateColumns="repeat(7, minmax(0, 1fr))"
      gap="1px"
      bg="border"
      borderWidth="1px"
      borderStyle="solid"
      borderColor="border"
      borderRadius="lg"
      overflow="hidden"
    >
      {DIAS_DA_SEMANA_CURTOS.map((nome) => (
        <Box
          key={nome}
          bg="bg.subtle"
          textAlign="center"
          fontSize="11px"
          fontWeight="800"
          color="fg.muted"
          textTransform="uppercase"
          py="8px"
        >
          {nome}
        </Box>
      ))}

      {grade.map((celula) => {
        const tarefas = porDia.get(celula.iso) || [];
        const ehHoje = celula.iso === isoDeHoje;
        const selecionado = celula.iso === isoSelecionado;

        return (
          <BotaoNu
            key={celula.iso}
            type="button"
            onClick={() => onEscolherDia(celula.iso)}
            aria-pressed={selecionado}
            aria-label={`Dia ${celula.dia}${tarefas.length ? `, ${tarefas.length} tarefa(s)` : ""}`}
            minW="0"
            w="100%"
            /* Altura FIXA, a do dia mais cheio (dois títulos e o "+N mais"):
               linhas de alturas diferentes deixam a grade irregular e a
               fazem pular ao trocar de mês. Sem espaço, só pontos. */
            h="100px"
            overflow="hidden"
            p="6px"
            css={{ [`@media ${TELA_SEM_ESPACO_PARA_O_MES}`]: { height: "52px", padding: "4px" } }}
            display="flex"
            flexDirection="column"
            gap="5px"
            textAlign="left"
            bg={celula.doMes ? "bg.surface" : "bg.subtle"}
            _hover={{ bg: "bg.subtle" }}
            /* Borda POR DENTRO: `outline` com recuo não empurra a grade. */
            outline={selecionado ? "2px solid" : undefined}
            outlineColor="fg.brand"
            outlineOffset="-2px"
          >
            <Flex
              align="center"
              justify="center"
              w="21px"
              h="21px"
              borderRadius="full"
              fontSize="12px"
              fontWeight="800"
              fontFamily="mono"
              bg={ehHoje ? "fg.brand" : undefined}
              color={ehHoje ? "white" : celula.doMes ? undefined : "fg.subtle"}
            >
              {celula.dia}
            </Flex>

            {/* Títulos no computador; no celular a célula não tem largura
                para texto, e ficam os pontos. */}
            {tarefas.length > 0 && (
              <Flex direction="column" gap="3px" minW="0" w="100%" css={{ [`@media ${TELA_SEM_ESPACO_PARA_O_MES}`]: { display: "none" } }}>
                {tarefas.slice(0, TITULOS_POR_CELULA).map((tarefa) => {
                  const concluida = tarefa.esta_concluida ?? false;
                  const alta = tarefa.prioridade === "Alta";
                  return (
                    <Text
                      key={`${tarefa.subgrupo_id}:${tarefa.tarefa_id}`}
                      title={tarefa.titulo}
                      truncate
                      minW="0"
                      fontSize="10.5px"
                      fontWeight="700"
                      borderRadius="5px"
                      px="6px"
                      py="2px"
                      bg={alta ? "bg.bad.subtle" : "border.subtle"}
                      color={concluida ? "fg.subtle" : alta ? CORES_DA_PRIORIDADE.Alta : undefined}
                      textDecoration={concluida ? "line-through" : undefined}
                    >
                      {tarefa.hora && (
                        <Box as="span" fontWeight="800">
                          {`${tarefa.hora} `}
                        </Box>
                      )}
                      {tarefa.titulo}
                    </Text>
                  );
                })}
                {tarefas.length > TITULOS_POR_CELULA && (
                  <Text fontSize="10.5px" fontWeight="700" color="fg.muted" px="6px">
                    +{tarefas.length - TITULOS_POR_CELULA} mais
                  </Text>
                )}
              </Flex>
            )}

            {tarefas.length > 0 && (
              <Flex gap="3px" display="none" css={{ [`@media ${TELA_SEM_ESPACO_PARA_O_MES}`]: { display: "flex" } }}>
                {tarefas.slice(0, PONTOS_POR_CELULA).map((tarefa) => (
                  <Box
                    key={`${tarefa.subgrupo_id}:${tarefa.tarefa_id}`}
                    w="6px"
                    h="6px"
                    borderRadius="full"
                    bg="fg.brand"
                  />
                ))}
              </Flex>
            )}
          </BotaoNu>
        );
      })}
    </Grid>
  );
}
