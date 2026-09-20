import { Etiqueta, EtiquetasDeSubgrupo, ItemDeLista, Ponto } from "../../../../components";
import { TIPO_ENVIO_LEMBRETE } from "../../../../constants";
import { formatarDataHora, mascararNumeroProcesso } from "../../../../utils";
import { CORES_DO_ENVIO } from "../../../../theme/envio";
import type { ItemDeHistoricoProps } from "./types";

/** Um envio onde não cabem colunas.
 *
 * 🔴 **A meta grudada por pontos se reparte.** A linha antiga dizia
 * `data e hora · tipo · órgão` num texto só; aqui o órgão é o apoio, o tipo
 * e a hora vão para o rodapé, e a situação do envio vira etiqueta ao lado
 * dos subgrupos.
 *
 * ⚠️ O ponto de não lido vai na SELEÇÃO -- o compartimento da frente. Ele
 * não é uma caixa de marcar, mas ocupa o mesmo lugar e pela mesma razão: uma
 * coluna alinhada pela qual o olho desce. É o que deixa uma falha visível
 * numa lista longa sem ler item por item.
 */
export default function ItemDeHistorico({
  item,
  subgruposVisiveis,
  onAbrir,
}: ItemDeHistoricoProps) {
  const falhou = Boolean(item.falhou);
  /* ⚠️ Só `false` é não lido: resposta antiga, sem o campo, não destaca nada
     -- não saber não é motivo pra chamar atenção. */
  const naoLido = item.lido === false;

  /** Lembrete de tarefa não tem processo: o assunto ocupa o lugar dele. */
  const ehDeTarefa = Boolean(item.tarefa_id);
  const titulo = ehDeTarefa
    ? item.assunto || "Lembrete de tarefa"
    : mascararNumeroProcesso(item.numero_processo);

  const tipo = item.tipo_envio === TIPO_ENVIO_LEMBRETE ? "Lembrete" : item.tipo_comunicacao;
  const destinatarios = item.destinatarios?.length ? `Pra: ${item.destinatarios.join(", ")}` : undefined;
  const subgrupos = subgruposVisiveis(item.subgrupos_notificados);

  return (
    <ItemDeLista
      onAbrir={() => onAbrir(item)}
      /* O estado vai no NOME, como na linha de tabela. */
      rotulo={`${titulo}, ${naoLido ? "não lido" : "lido"}${falhou ? ", falha no envio" : ""}`}
      destacado={naoLido}
      selecao={<Ponto tom={falhou ? "ruim" : "marca"} vazado={!naoLido} />}
      identificador={titulo}
      identificadorMono={!ehDeTarefa}
      apoio={item.nome_orgao || destinatarios}
      etiquetas={
        <>
          <Etiqueta cores={falhou ? CORES_DO_ENVIO.falhou : CORES_DO_ENVIO.enviado}>
            {falhou ? "Falha" : "Enviado"}
          </Etiqueta>
          {/* 🔴 Só os subgrupos QUE VOCÊ PARTICIPA -- ver `LinhaDeHistorico`
              e `useNomesDeSubgruposVisiveis`. O travessão do vazio fica: a
              linha precisa continuar legível quando o registro é antigo e
              não tem o campo. */}
          <EtiquetasDeSubgrupo nomes={subgrupos} />
        </>
      }
      rodape={{ texto: [tipo, formatarDataHora(item.enviado_em)].filter(Boolean).join(" · ") }}
    />
  );
}
