import { useEffect } from "react";

/* Irmãos importados um a um, e não pelo índice de `components`: este componente É exportado por aquele índice. */
import Esqueleto from "../Esqueleto";
import Modal from "../Modal";
import { useToast } from "../../contexts/ToastContext";
import FormularioDeTarefa from "./FormularioDeTarefa";
import { useTarefaPelaChave } from "./useTarefaPelaChave";
import type { ModalDeTarefaProps } from "./types";

/** Criar e editar tarefa. Editando, a tarefa é lida PELA CHAVE antes de o formulário montar.
 *
 * 🔴 O formulário semeia o estado uma vez, ao montar: montá-lo com a tarefa da lista (sem o aviso) ou do cache (com
 * a hora velha) faria salvar gravar o que a pessoa não viu. Por isso ele só nasce com a tarefa lida agora, e com
 * `key` pelo id. ⚠️ 404 na leitura é tarefa excluída: fecha com aviso, e a lista atrás recarrega.
 */
export default function ModalDeTarefa(props: ModalDeTarefaProps) {
  const { tarefa: chave, onSalvo, onFechar } = props;
  const { tarefa, sumiu, falhou } = useTarefaPelaChave(chave ?? null);
  const toast = useToast();

  useEffect(() => {
    if (!falhou) return;
    toast.erro(sumiu ? "Esta tarefa foi excluída." : "Não foi possível abrir a tarefa.");
    if (sumiu) onSalvo();
    onFechar();
  }, [falhou, sumiu, toast, onSalvo, onFechar]);

  if (!chave) return <FormularioDeTarefa {...props} tarefa={null} />;
  if (!tarefa) {
    return (
      <Modal titulo="Editar tarefa" descarte="semFormulario" onFechar={onFechar}>
        <Esqueleto linhas={4} altura="44px" />
      </Modal>
    );
  }
  return <FormularioDeTarefa key={tarefa.tarefa_id} {...props} tarefa={tarefa} />;
}
