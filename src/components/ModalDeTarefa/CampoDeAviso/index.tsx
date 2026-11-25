import { Checkbox, Flex, Input, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";

import Campo from "../../Campo";
import { PilulaDeFiltro } from "../../PilulaDeFiltro";
import { Select } from "../../Select";
import { AVISO_MINUTOS_MAXIMO, AVISO_MINUTOS_PADRAO, AVISOS_RAPIDOS, UNIDADES_DO_AVISO } from "../../../constants/aviso";
import { avisoEmUnidade } from "../../../utils/horaDaTarefa";
import type { CampoDeAvisoProps } from "./types";

/** O aviso antes da hora: desligado por padrão; ligado, 1 hora; escolhas rápidas ou "Outro", até 7 dias.
 *
 * ⚠️ "Outro" nasce do valor GRAVADO em número e unidade exatos (`avisoEmUnidade`): 90 minutos aparecem como 90
 * minutos, e salvar sem mexer não muda nada.
 */
export default function CampoDeAviso({ minutos, onMudar }: CampoDeAvisoProps) {
  const rapida = AVISOS_RAPIDOS.some((r) => r.minutos === minutos);
  const [outro, setOutro] = useState(minutos !== null && !rapida);
  const inicial = avisoEmUnidade(minutos !== null && !rapida ? minutos : 120);
  const [numero, setNumero] = useState(String(inicial.numero));
  const [unidade, setUnidade] = useState(inicial.unidade);
  const ligado = minutos !== null;

  const aplicarOutro = (n: string, u: string) => {
    const valor = Number(n) * Number(u);
    if (Number.isInteger(valor) && valor >= 1 && valor <= AVISO_MINUTOS_MAXIMO) onMudar(valor);
  };

  return (
    <Campo rotulo="Aviso antes" para="tf-aviso" dica="Por e-mail e no sino, para o responsável (ou o subgrupo, se não houver).">
      <Stack gap="10px">
        <Checkbox.Root
          id="tf-aviso"
          checked={ligado}
          onCheckedChange={(e) => {
            setOutro(false);
            onMudar(e.checked ? AVISO_MINUTOS_PADRAO : null);
          }}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Avisar antes do horário</Checkbox.Label>
        </Checkbox.Root>

        {ligado && (
          <Flex gap="6px" wrap="wrap" role="radiogroup" aria-label="Quanto tempo antes">
            {AVISOS_RAPIDOS.map((r) => (
              <PilulaDeFiltro
                key={r.minutos}
                role="radio"
                aria-checked={!outro && minutos === r.minutos}
                ativo={!outro && minutos === r.minutos}
                onClick={() => {
                  setOutro(false);
                  onMudar(r.minutos);
                }}
              >
                {r.rotulo}
              </PilulaDeFiltro>
            ))}
            <PilulaDeFiltro
              role="radio"
              aria-checked={outro}
              ativo={outro}
              onClick={() => {
                setOutro(true);
                aplicarOutro(numero, unidade);
              }}
            >
              Outro
            </PilulaDeFiltro>
          </Flex>
        )}

        {ligado && outro && (
          <Flex gap="8px" align="center">
            <Input
              aria-label="Quantidade"
              type="number"
              min={1}
              w="80px"
              h="38px"
              value={numero}
              onChange={(e) => {
                setNumero(e.target.value);
                aplicarOutro(e.target.value, unidade);
              }}
            />
            <Flex>
              <Select
                largura="120px"
                id="tf-aviso-unidade"
                opcoes={[...UNIDADES_DO_AVISO]}
                valor={unidade}
                onMudar={(u: string) => {
                  setUnidade(u);
                  aplicarOutro(numero, u);
                }}
              />
            </Flex>
            <Text fontSize="13px" color="fg.subtle">antes</Text>
          </Flex>
        )}
      </Stack>
    </Campo>
  );
}
