import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";

import {
  CampoDeLeitura,
  Esqueleto,
  Etiqueta,
  EtiquetaDeMetadado,
  Faixa,
  Ponto,
  TextoDaComunicacao,
} from "../../../../components";
import { TIPO_ENVIO_LEMBRETE } from "../../../../constants";
import { teorDaMovimentacao } from "../../../../services";
import { qk } from "../../../../services/queryKeys";
import { CORES_DO_ENVIO } from "../../../../theme/envio";
import { formatarDataHora, mascararNumeroProcesso } from "../../../../utils";
import type { Comunicacao } from "../../../../types";
import type { DetalheHistoricoProps } from "./types";

/** O detalhe de UM envio.
 *
 * Diferente da lista de movimentações de um processo: aqui é só a
 * comunicação que gerou esta notificação, buscada pela ROTA DO ITEM
 * (`GET /processos/{numero}/comunicacoes/{id}`) -- uma chamada, um item.
 *
 * 🔴 **O teor NÃO vem da lista de movimentações do processo.** Ela não o
 * carrega: medido, o texto é 97% do peso de cada movimentação, e a tela de
 * processos não o mostra. Ler o teor dali deixava este campo VAZIO, sem erro
 * nenhum -- e nenhum teste daqui via, porque conferiam apelido e
 * destinatários, nunca o texto. `o detalhe mostra o TEOR da publicação` é o
 * guarda disso.
 *
 * ⚠️ O `apelido` vem na MESMA resposta, de propósito: era ele que obrigava a
 * pedir o detalhe INTEIRO do processo para mostrar UMA movimentação.
 */
export default function DetalheHistorico({ item }: DetalheHistoricoProps) {
  const ehDeTarefa = Boolean(item.tarefa_id);
  const ehLembrete = item.tipo_envio === TIPO_ENVIO_LEMBRETE;
  const falhou = Boolean(item.falhou);

  /** Consulta sempre que houver processo pra consultar, e não só quando
   * houver `comunicacao_id`: o apelido vem daqui, e registro antigo (sem o
   * id da comunicação) também tem processo. O id decide só qual texto
   * mostrar. Lembrete de tarefa não tem processo nenhum -- `numero_processo`
   * lá guarda `TAREFA#{id}` porque é chave de partição. */
  const habilitado = !ehDeTarefa;

  /* ⚠️ Sem `comunicacao_id` não há teor a buscar -- registro antigo não tem o
     campo, e a tela cai no `item.mensagem`, como sempre caiu. */
  const temComunicacao = habilitado && item.comunicacao_id != null;
  const query = useQuery<Comunicacao & { apelido?: string | null }>({
    queryKey: qk.teorDaMovimentacao(item.numero_processo, item.comunicacao_id ?? ""),
    queryFn: () => teorDaMovimentacao(item.numero_processo, item.comunicacao_id as number),
    enabled: temComunicacao,
  });

  const carregando = temComunicacao && query.isPending;
  const erroAoCarregar =
    temComunicacao && query.isError
      ? query.error instanceof Error
        ? query.error.message
        : "Não foi possível carregar."
      : null;
  const comunicacao = temComunicacao ? (query.data ?? null) : null;
  // O apelido vem na MESMA resposta desde o conserto -- era ele que obrigava
  // a pedir o detalhe inteiro do processo.
  const apelido = query.data?.apelido;

  return (
    <Stack gap="16px">
      <Flex align="center" gap="8px" wrap="wrap">
        <Etiqueta cores={falhou ? CORES_DO_ENVIO.falhou : CORES_DO_ENVIO.enviado}>
          {falhou ? "Falha no envio" : "Enviado"}
        </Etiqueta>
        <EtiquetaDeMetadado>{formatarDataHora(item.enviado_em)}</EtiquetaDeMetadado>
        {ehLembrete && <EtiquetaDeMetadado>Lembrete</EtiquetaDeMetadado>}
        {item.tipo_comunicacao && <EtiquetaDeMetadado>{item.tipo_comunicacao}</EtiquetaDeMetadado>}
        {item.nome_orgao && <EtiquetaDeMetadado>{item.nome_orgao}</EtiquetaDeMetadado>}
      </Flex>

      {/* O servidor guarda o motivo da falha justamente pra responder "não
          fui avisado" -- até agora isso só existia no log. */}
      {falhou && item.erro && (
        <Faixa tom="aviso" aEsquerda>
          {`Não foi entregue: ${item.erro}`}
        </Faixa>
      )}

      {item.assunto && (
        <CampoDeLeitura rotulo="Assunto">
          <Text fontSize="13.5px">{item.assunto}</Text>
        </CampoDeLeitura>
      )}

      {/* Lembrete de tarefa não tem processo: um campo "Processo" vazio é
          pior que campo nenhum. */}
      {!ehDeTarefa && (
        <CampoDeLeitura rotulo="Processo">
          {/* Os dois vão num bloco só: filhos diretos do campo herdariam o
              intervalo dele (6px) e o apelido descolaria do número que ele
              nomeia. */}
          <Box>
            <Text fontSize="13.5px" fontFamily="mono">
              {mascararNumeroProcesso(item.numero_processo)}
            </Text>
            {/* O apelido embaixo do número: 20 dígitos não dizem de que
                processo se trata, e o apelido é justamente o nome que
                alguém deu pra reconhecê-lo. */}
            {apelido && (
              <Text fontSize="11.5px" color="fg.subtle">
                {apelido}
              </Text>
            )}
          </Box>
        </CampoDeLeitura>
      )}

      {/* Um por linha, e não separados por vírgula como na listagem: aqui é
          onde se confere QUEM recebeu, e uma fila de endereços colada não se
          lê -- na linha da lista, que precisa caber em uma linha, a vírgula
          continua fazendo sentido. */}
      {item.destinatarios && item.destinatarios.length > 0 && (
        <CampoDeLeitura rotulo="Destinatários">
          <Stack gap="6px">
            {item.destinatarios.map((email) => (
              <Flex key={email} align="center" gap="9px">
                <Ponto />
                <Text fontSize="13.5px">{email}</Text>
              </Flex>
            ))}
          </Stack>
        </CampoDeLeitura>
      )}

      {/* Dois rótulos porque são duas coisas: no lembrete o texto foi
          escrito pelo sistema, na movimentação ele é o que o tribunal
          publicou. */}
      <CampoDeLeitura rotulo={ehLembrete ? "Mensagem enviada" : "Teor da publicação"}>
        {carregando && <Esqueleto linhas={2} />}
        {!carregando && erroAoCarregar && (
          <Text fontSize="13px" color="fg.subtle">
            {erroAoCarregar}
          </Text>
        )}
        {!carregando && !erroAoCarregar && (
          <TextoDaComunicacao
            inteiro
            html={comunicacao?.texto}
            textoPlano={comunicacao ? undefined : item.mensagem || "Texto não disponível."}
          />
        )}
      </CampoDeLeitura>
    </Stack>
  );
}

