import { Input } from "@chakra-ui/react";

import BotaoDeTexto from "../../BotaoDeTexto";
import Campo from "../../Campo";
import type { CampoDeHorarioProps } from "./types";

/** O horário da tarefa, opcional: com hora, ela atrasa no mesmo dia, quando a hora passa.
 *
 * ⚠️ `validity.badInput` decide se o campo está incompleto: o `value` de um `type="time"` pela metade é `""`, o
 * mesmo de vazio, e só a validade distingue "apagou" de "ainda digitando".
 */
export default function CampoDeHorario({ hora, onMudar, onIncompleta, onSemHorario, incompleta }: CampoDeHorarioProps) {
  return (
    <Campo
      rotulo="Horário"
      para="tf-hora"
      erro={incompleta ? "Complete o horário, ou apague-o." : undefined}
      dica={hora ? <BotaoDeTexto onClick={onSemHorario}>Sem horário</BotaoDeTexto> : "Opcional."}
    >
      <Input
        id="tf-hora"
        type="time"
        /* 38px, a altura do seletor de data ao lado: o `Input` cru sai com 42. */
        h="38px"
        value={hora}
        onChange={(e) => {
          onIncompleta(e.target.validity.badInput);
          onMudar(e.target.value);
        }}
      />
    </Campo>
  );
}
