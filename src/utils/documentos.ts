import { mascararNumeroProcesso } from "./mask";
import type { Documento, VinculoDoDocumento } from "../types";

/** A que um documento pertence, em duas partes: o vínculo e quem está por
 * trás dele.
 *
 * 🔴 Prioriza o vínculo MAIS ESPECÍFICO: um documento ligado a um processo e
 * ao cliente daquele processo é encontrado pelo processo, e repetir o
 * cliente ao lado só gasta a largura.
 *
 * 🔴 **Em `utils/`, e não dentro de um dos dois componentes que a usam.** A
 * lista de documentos tem duas formas -- linha de tabela e item de várias
 * linhas --, e as duas precisam responder a MESMA pergunta. Enquanto esta
 * função morava dentro da linha, a segunda forma nasceu com uma cópia que já
 * divergia na assinatura. É a mesma régua de `camposAlterados` e
 * `colunaComRotulo`: transformação de dado não mora em quem desenha.
 */
export function vinculoDoDocumento(d: Documento): VinculoDoDocumento {
  const clientes = (d.cliente_nomes?.length ? d.cliente_nomes : d.cliente_ids) ?? [];
  if (d.processo_numero) {
    return {
      principal: mascararNumeroProcesso(d.processo_numero),
      sub: clientes.join(", ") || undefined,
    };
  }
  if (d.atendimento_id) {
    return { principal: "Atendimento", sub: clientes.join(", ") || undefined };
  }
  if (clientes.length) return { principal: clientes.join(", ") };
  return { principal: "" };
}
