// src/app/admin/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";
import { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Читаем cookie "token" на сервере
  const token = cookies().get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    // Верифицируем JWT (проверяется срок и подпись)
    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET!)
    );

    // Если роль не "admin" — редирект
    if (payload.role !== "admin") {
      redirect("/login");
    }
  } catch {
    redirect("/login");
  }

  return <>{children}</>;
}
