// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();

  // Обработчик выхода
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="bg-indigo-600 text-white px-6 py-3 flex justify-between items-center">
      <Link href="/">
        <a className="text-2xl font-semibold hover:underline">MyMentalApp</a>
      </Link>

      <div className="flex items-center space-x-4">
        {!session && (
          <>
            <Link href="/login">
              <a className="hover:underline">Войти</a>
            </Link>
            <Link href="/register">
              <a className="hover:underline">Регистрация</a>
            </Link>
          </>
        )}

        {session && (
          <>
            <Link href="/dashboard">
              <a className="hover:underline">Личный кабинет</a>
            </Link>

            {session.user.user_metadata?.role === "admin" && (
              <Link href="/admin">
                <a className="hover:underline">Админ</a>
              </Link>
            )}

            <button
              onClick={handleSignOut}
              className="bg-indigo-800 hover:bg-indigo-900 px-3 py-1 rounded"
            >
              Выйти
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
