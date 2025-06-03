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
      {/* Логотип/название */}
      <Link href="/" className="text-2xl font-semibold hover:underline">
        MyMentalApp
      </Link>

      <div className="flex items-center space-x-4">
        {!session && (
          <>
            <Link href="/login" className="hover:underline">
              Войти
            </Link>
            <Link href="/register" className="hover:underline">
              Регистрация
            </Link>
          </>
        )}

        {session && (
          <>
            <Link href="/dashboard" className="hover:underline">
              Личный кабинет
            </Link>

            {/* Если роль admin, показываем ссылку "Админ" */}
            {session.user.user_metadata?.role === "admin" && (
              <Link href="/admin" className="hover:underline">
                Админ
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
