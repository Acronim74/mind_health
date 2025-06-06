// src/app/admin/users/page.tsx

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import DeleteUserButton from "@/components/DeleteUserButton";

interface UserRow {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default async function AdminUsersPage() {
  // 1) Инициализируем Supabase (Service Role Key) на сервере
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 2) Загружаем всех пользователей из app_users
  const { data: users, error } = await supabase
    .from("app_users")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-4">Управление пользователями</h2>
        <p className="text-red-500">Ошибка при загрузке пользователей: {error.message}</p>
      </div>
    );
  }

  // Преобразуем для типизации
  const list: UserRow[] = (users || []).map((u: any) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    created_at: u.created_at,
  }));

  return (
    <div className="p-8">
      {/* Навигация: «← К админ-панели» + кнопка «Создать пользователя» (опционально) */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/admin">
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-4">
              ← К админ-панели
            </button>
          </Link>
          <span className="text-2xl font-semibold">Список пользователей</span>
        </div>
        {/* При необходимости можно добавить кнопку «Создать пользователя вручную» */}
        {/* <Link href="/admin/users/create">
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
            Создать пользователя
          </button>
        </Link> */}
      </div>

      {list.length > 0 ? (
        <table className="w-full table-auto border-collapse shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">ID</th>
              <th className="border px-4 py-2 text-left">Email</th>
              <th className="border px-4 py-2 text-left">Роль</th>
              <th className="border px-4 py-2 text-left">Дата регистрации</th>
              <th className="border px-4 py-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2 w-1/6 text-sm">{u.id}</td>
                <td className="border px-4 py-2 w-1/4">{u.email}</td>
                <td className="border px-4 py-2 w-1/6">{u.role}</td>
                <td className="border px-4 py-2 w-1/6">
                  {new Date(u.created_at).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="border px-4 py-2 w-1/4 space-x-2">
                  <Link href={`/admin/users/${u.id}/edit`}>
                    <button className="text-indigo-600 hover:underline">
                      Изменить роль
                    </button>
                  </Link>
                  <DeleteUserButton userId={u.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">Пользователей не найдено.</p>
      )}
    </div>
  );
}
