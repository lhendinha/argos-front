import { BotaoNu, IconePlus } from "../../../../components";
import type { BotaoDeAssumirProps } from "./types";

/** Assumir uma tarefa sem dono (`.avatar-empty` do artifact).
 *
 * É um avatar VAZIO, no mesmo lugar onde apareceria a cara de quem é
 * responsável -- borda tracejada e um "+" dentro. A forma já conta a
 * história: ali falta alguém, e o clique preenche.
 *
 * Por isso não há também um botão "Assumir" na linha: dois botões pra mesma
 * ação, um do lado do outro, só confundem.
 */
export default function BotaoDeAssumir({ rotulo, desabilitado, onAssumir }: BotaoDeAssumirProps) {
  return (
    <BotaoNu
      type="button"
      title="Sem responsável — clique para assumir"
      aria-label={rotulo}
      disabled={desabilitado}
      onClick={onAssumir}
      display="flex"
      alignItems="center"
      justifyContent="center"
      w="22px"
      h="22px"
      flex="0 0 auto"
      p="0"
      borderRadius="full"
      borderWidth="1.5px"
      borderStyle="dashed"
      borderColor="fg.subtle"
      bg="transparent"
      color="fg.subtle"
      _hover={{ borderColor: "fg.brand", color: "fg.brand" }}
      /* 🔴 A ÁREA DE TOQUE cresce, o desenho não. Medido no celular: este
         círculo tem 19px, e o dedo cobre uns 44 -- errar a tarefa vizinha é
         o resultado esperado. Esticar o círculo até 44 estragaria a lista
         (o docstring acima explica por que ele é discreto), então quem
         cresce é um retângulo invisível por cima. `inset` negativo de 12px
         dá ~43px de alvo, e ele some onde o apontador é fino. */
      position="relative"
      _after={{
        content: '""',
        position: "absolute",
        inset: "-12px",
        "@media (pointer: fine)": { display: "none" },
      }}
      css={{ "& svg": { width: "11px", height: "11px" } }}
    >
      <IconePlus />
    </BotaoNu>
  );
}
