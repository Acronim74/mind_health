// src/app/Providers.tsx
"use client";

import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={null}>
      {children}
    </SessionContextProvider>
  );
}
