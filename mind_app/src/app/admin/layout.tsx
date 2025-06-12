// src/app/admin/layout.tsx
import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // 1) Аутентификация по JWT в cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return redirect("/login");

  try {
    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET!)
    );
    const user = payload as { sub: string; role: string };
    if (user.role !== "admin") return redirect("/login");
  } catch {
    return redirect("/login");
  }

  // 2) Опционально: можно сразу загрузить базовые данные через supabaseAdmin
  //    const { data: groups } = await supabaseAdmin.from("groups").select("*");

  return <>{children}</>;
}
