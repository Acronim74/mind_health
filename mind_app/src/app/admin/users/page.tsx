// src/app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase
        .from<User>("app_users")
        .select("id, email, role, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Ошибка при получении списка пользователей:", error);
      } else if (data) {
        setUsers(data);
      }
      setLoading(false);
    }

    fetchUsers();
  }, []);

  if (loading) {
    return <p className="p-8">Загрузка списка пользователей...</p>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-4">Список пользователей</h2>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-left">Email</th>
            <th className="border px-4 py-2 text-left">Роль</th>
            <th className="border px-4 py-2 text-left">Дата регистрации</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="border px-4 py-2">{u.email}</td>
              <td className="border px-4 py-2">{u.role}</td>
              <td className="border px-4 py-2">
                {new Date(u.created_at).toLocaleString("ru-RU")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
