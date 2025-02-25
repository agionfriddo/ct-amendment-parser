"use client";

import { ReactNode } from "react";
import { AuthProvider } from "./AuthContext";
import { AmendmentsProvider } from "./AmendmentsContext";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <AmendmentsProvider>{children}</AmendmentsProvider>
    </AuthProvider>
  );
}
