// src/app/dashboard/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";
import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    // Важно: SECRET должен быть доступен на сервере (в .env.local)
    await jose.jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!));
  } catch (err) {
    redirect("/login");
  }

  return <>{children}</>;
}
