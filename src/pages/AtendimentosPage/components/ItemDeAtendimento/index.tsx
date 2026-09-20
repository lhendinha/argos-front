import { Avatar, Etiqueta, EtiquetasDeSubgrupo, ItemDeLista } from "../../../../components";
import { coresDoStatus } from "../../../../theme/atendimento";
import { formatarDataDeInstante } from "../../../../utils";
import type { ItemDeAtendimentoProps } from "./types";

/** O atendimento onde não cabem colunas.
 *
 * 🔴 **O assunto é o identificador; a data desce para o rodapé.** A lista
 * antiga começava pela data de abertura, em azul e monoespaçada, e o assunto
 * vinha depois de um travessão. Era a única lista do sistema que começava
 * por quando em vez de por o quê -- e quem varre a lista procura o assunto.
 *
 * ⚠️ O último registro NÃO entra: aqui ele seria uma quarta linha de texto
 * truncado, e o item já responde qual atendimento é, de quem, e quando mexeu.
 * Ele existe na tabela, onde tem 371px de coluna.
 */
export default function ItemDeAtendimento({
  atendimento,
  subgrupoNome,
  onAbrir,
}: ItemDeAtendimentoProps) {
  /* Id que não resolve cai no próprio id -- some da tela seria pior: o item
     não diria a quem o atendimento pertence. */
  const clientes = (
    atendimento.cliente_nomes?.length ? atendimento.cliente_nomes : atendimento.cliente_ids
  ).join(", ");
  const ultimo = atendimento.ultimo_registro;

  return (
    <ItemDeLista
      onAbrir={() => onAbrir(atendimento)}
      rotulo={atendimento.assunto}
      identificador={atendimento.assunto}
      apoio={clientes || undefined}
      etiquetas={
        <>
          <Etiqueta cores={coresDoStatus(atendimento.status)}>{atendimento.status}</Etiqueta>
          <EtiquetasDeSubgrupo nomes={[subgrupoNome(atendimento.subgrupo_id)]} />
        </>
      }
      rodape={{
        texto: `Aberto em ${formatarDataDeInstante(atendimento.criado_em)}`,
        destaque: ultimo ? (
          <Avatar nome={ultimo.autor_nome ?? ultimo.autor_id} tamanho="pequeno" />
        ) : undefined,
      }}
    />
  );
}
