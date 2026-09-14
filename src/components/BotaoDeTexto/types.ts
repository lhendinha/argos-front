import type { ReactNode } from "react";

export interface BotaoDeTextoProps {
  onClick: () => void;
  children: ReactNode;
  /** Sem ação no momento -- o "Tudo lido" do Histórico, quando não há o que marcar. */
  desabilitado?: boolean;
}
