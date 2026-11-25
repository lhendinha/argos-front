/** O dia e a hora de Brasília, que avançam a cada minuto -- para a etiqueta de prazo ficar vermelha quando a hora
 * da tarefa passa, sem recarregar a tela.
 *
 * ⚠️ Acorda na virada do minuto, e não a cada 60 s contados da montagem: senão a etiqueta das 09:00 só mudaria
 * até um minuto depois das 09:01.
 * ➡️ `components/EtiquetaDePrazo/index.test.tsx`
 */
import { useEffect, useState } from "react";

import { agoraEmBrasilia } from "../utils/horaDaTarefa";

export function useAgoraEmBrasilia() {
  const [agora, setAgora] = useState(() => agoraEmBrasilia());
  useEffect(() => {
    let espera: ReturnType<typeof setTimeout>;
    const agendar = () => {
      espera = setTimeout(() => {
        setAgora(agoraEmBrasilia());
        agendar();
      }, 60_000 - (Date.now() % 60_000) + 50);
    };
    agendar();
    return () => clearTimeout(espera);
  }, []);
  return agora;
}
