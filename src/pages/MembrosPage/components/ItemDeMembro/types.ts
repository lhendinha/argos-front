import type { Membro } from "../../../../types";

export interface ItemDeMembroProps {
  membro: Membro;
  /** Nome de cada subgrupo da pessoa -- vem resolvido NO membro, pelo
   * servidor. Ver `TabelaDeMembros`. */
  subgruposNomes: string[];
  podeEditar: boolean;
  onEditar: (membro: Membro) => void;
}
