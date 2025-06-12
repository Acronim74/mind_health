// src/app/admin/groups/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";
import { ReactNode } from "react";

interface GroupsLayoutProps {
  children: ReactNode;
}

export default async function GroupsLayout({ children }: GroupsLayoutProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  try {
    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET!)
    );
    const user = payload as { sub: string; role: string };
    if (user.role !== "admin" && user.role !== "subadmin") redirect("/login");
  } catch {
    redirect("/login");
  }

  return <>{children}</>;
}
