import type { ReactNode } from "react";

export interface GavetaProps {
  aberta: boolean;
  onFechar: () => void;
  children: ReactNode;
}
