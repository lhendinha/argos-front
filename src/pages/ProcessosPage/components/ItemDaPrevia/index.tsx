import { Checkbox } from "@chakra-ui/react";

import { ItemDeLista } from "../../../../components";
import { contar, mascararNumeroProcesso } from "../../../../utils";
import EtiquetaDeSituacao from "../EtiquetaDeSituacao";
import type { ItemDaPreviaProps } from "./types";

/** O processo achado na OAB, onde não cabem as cinco colunas.
 *
 * 🔴 **Estreia o compartimento `selecao`** -- a caixa vai NA FRENTE, e não em
 * `acoes`. Foi desenhado e comparado: em `acoes` a caixa fica depois do que
 * ela governa (lê-se o processo inteiro para então achar como marcá-lo), e
 * como `acoes` centraliza na vertical, a coluna desalinha assim que dois
 * itens têm alturas diferentes -- e aqui têm, porque uns já existem e outros
 * não.
 *
 * ⚠️ **O item inteiro alterna a marca**, como a linha da tabela: `onAbrir` é
 * o alternar. Não há para onde "abrir" -- estes processos ainda não existem
 * no sistema.
 *
 * ⚠️ O já cadastrado não alterna e sai esmaecido: é a única linha que não vai
 * a lugar nenhum.
 */
export default function ItemDaPrevia({ processo, marcado, onAlternar }: ItemDaPreviaProps) {
  return (
    <ItemDeLista
      onAbrir={() => !processo.ja_existe && onAlternar()}
      rotulo={`Importar ${processo.apelido}`}
      destacado={marcado}
      selecao={
        <Checkbox.Root
          checked={marcado}
          disabled={processo.ja_existe}
          onCheckedChange={onAlternar}
          aria-label={`Importar ${processo.apelido}`}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
        </Checkbox.Root>
      }
      identificador={processo.apelido}
      apoio={mascararNumeroProcesso(processo.numero_processo)}
      apoioMono
      etiquetas={<EtiquetaDeSituacao processo={processo} />}
      rodape={{
        texto: processo.tribunal || "—",
        destaque: contar(processo.comunicacoes, "comunicação", "comunicações"),
      }}
    />
  );
}
