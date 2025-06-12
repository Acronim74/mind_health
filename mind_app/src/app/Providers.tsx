// src/app/Providers.tsx
"use client";

import React, { ReactNode } from "react";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
}
