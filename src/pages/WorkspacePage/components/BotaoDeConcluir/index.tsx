import { BotaoNu, IconeCheck } from "../../../../components";
import type { BotaoDeConcluirProps } from "./types";

/** O círculo de concluir, à esquerda da tarefa (`.task-check` do artifact).
 *
 * Em repouso é quase invisível -- borda e tique na cor da divisória. Só no
 * hover ele assume a cor da marca. É de propósito: numa lista de dez
 * tarefas, dez círculos berrantes competiriam com os títulos, que são o que
 * se lê.
 */
export default function BotaoDeConcluir({ rotulo, desabilitado, onConcluir }: BotaoDeConcluirProps) {
  return (
    <BotaoNu
      type="button"
      title="Concluir"
      aria-label={rotulo}
      disabled={desabilitado}
      onClick={onConcluir}
      display="flex"
      alignItems="center"
      justifyContent="center"
      w="19px"
      h="19px"
      flex="0 0 auto"
      borderRadius="full"
      borderWidth="2px"
      borderColor="border"
      bg="bg.surface"
      color="border"
      _hover={{ borderColor: "fg.brand", color: "fg.brand" }}
      /* 🔴 A ÁREA DE TOQUE cresce, o desenho não. Medido no celular: este
         círculo tem 19px, e o dedo cobre uns 44 -- errar a tarefa vizinha é
         o resultado esperado. Esticar o círculo até 44 estragaria a lista
         (o docstring acima explica por que ele é discreto), então quem
         cresce é um retângulo invisível por cima. `inset` negativo de 12px
         dava 43px de alvo -- um pixel curto da régua, medido. 12.5 fecha os
         44, e o pseudo-elemento some onde o apontador é fino. */
      position="relative"
      _after={{
        content: '""',
        position: "absolute",
        inset: "-12.5px",
        "@media (pointer: fine)": { display: "none" },
      }}
      css={{ "& svg": { width: "11px", height: "11px" } }}
    >
      <IconeCheck />
    </BotaoNu>
  );
}
