// src/app/dashboard/layout.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = useSession();
  const router = useRouter();

  // Если сессии нет — перекидываем на страницу входа
  useEffect(() => {
    if (session === null) {
      // session === null означает, что мы уже проверили, но пользователя нет
      router.replace("/login");
    }
  }, [session, router]);

  // Пока ждём, когда useSession разрешит либо установит session, можно рендерить ничего 
  if (session === undefined || session === null) {
    return null; // не показываем контент, пока не убедились, что есть сессия
  }

  // Пользователь авторизован — показываем children
  return <>{children}</>;
}
