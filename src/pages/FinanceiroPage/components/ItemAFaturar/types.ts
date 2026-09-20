import type { ClienteAFaturar } from "../../../../types";

export interface ItemAFaturarProps {
  cliente: ClienteAFaturar;
  onEmitir: (cliente: ClienteAFaturar) => void;
}
