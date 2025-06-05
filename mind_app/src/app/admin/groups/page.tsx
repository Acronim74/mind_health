// src/app/admin/groups/page.tsx
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import DeleteGroupButton from "@/components/DeleteGroupButton";

// Инициализируем Supabase-клиент на сервере с Service Role Key
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Group {
  id: number;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export default async function AdminGroupsPage() {
  // Получаем все группы, упорядоченные по дате создания (по убыванию)
  const { data: groups, error } = await supabase
    .from<Group>("groups")
    .select("id, title, description, created_by, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-4">Управление группами</h2>
        <p className="text-red-500">
          Ошибка при загрузке списка групп: {error.message}
        </p>
        <div className="mt-6">
          <Link href="/admin">
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
              В кабинет админа
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Верхняя панель: Назад в админка и Создать */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/admin">
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-4">
              В кабинет админа
            </button>
          </Link>
          <span className="text-2xl font-semibold">Список групп</span>
        </div>
        <Link href="/admin/groups/create">
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
            Создать новую группу
          </button>
        </Link>
      </div>

      {groups && groups.length > 0 ? (
        <table className="w-full table-auto border-collapse shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">ID</th>
              <th className="border px-4 py-2 text-left">Название</th>
              <th className="border px-4 py-2 text-left">Описание</th>
              <th className="border px-4 py-2 text-left">Создал</th>
              <th className="border px-4 py-2 text-left">Дата создания</th>
              <th className="border px-4 py-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{g.id}</td>
                <td className="border px-4 py-2">{g.title}</td>
                <td className="border px-4 py-2">{g.description || "—"}</td>
                <td className="border px-4 py-2">{g.created_by}</td>
                <td className="border px-4 py-2">
                  {new Date(g.created_at).toLocaleString("ru-RU")}
                </td>
                <td className="border px-4 py-2 space-x-2">
                  <Link href={`/admin/groups/${g.id}/edit`}>
                    <button className="text-indigo-600 hover:underline">
                      Редактировать
                    </button>
                  </Link>
                  <Link href={`/admin/groups/${g.id}`}>
                    <button className="text-blue-600 hover:underline">
                      Детали
                    </button>
                  </Link>
                  <DeleteGroupButton groupId={g.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">Группы не найдены.</p>
      )}
    </div>
  );
}
