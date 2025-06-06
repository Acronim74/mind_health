// src/app/admin/questionnaires/page.tsx

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import DeleteQuestionnaireButton from "@/components/DeleteQuestionnaireButton";

interface QuestionnaireRow {
  id: number;
  title: string;
  group_id: number;
  group_title: string | null;
  is_active: boolean;
  created_at: string;
}

export default async function AdminQuestionnairesPage() {
  // 1) Инициализируем Supabase на сервере (Service Role Key)
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 2) Загружаем все анкеты с JOIN на группу
  const { data: questionnaires, error } = await supabase
    .from("questionnaires")
    .select(`
      id,
      title,
      group_id,
      is_active,
      created_at,
      groups ( title )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-4">Управление анкетами</h2>
        <p className="text-red-500">
          Ошибка при загрузке списка анкет: {error.message}
        </p>
      </div>
    );
  }

  // Преобразуем, чтобы достать groups.title → group_title
  const list: QuestionnaireRow[] = (questionnaires || []).map((q: any) => ({
    id: q.id,
    title: q.title,
    group_id: q.group_id,
    group_title: q.groups?.title || null,
    is_active: q.is_active,
    created_at: q.created_at,
  }));

  return (
    <div className="p-8">
      {/* Навигация: «← К админ-панели» + кнопка «Создать новую анкету» */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/admin">
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-4">
              ← К админ-панели
            </button>
          </Link>
          <span className="text-2xl font-semibold">Список анкет</span>
        </div>
        <Link href="/admin/questionnaires/create">
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
            Создать новую анкету
          </button>
        </Link>
      </div>

      {list.length > 0 ? (
        <table className="w-full table-auto border-collapse shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">ID</th>
              <th className="border px-4 py-2 text-left">Название</th>
              <th className="border px-4 py-2 text-left">Группа</th>
              <th className="border px-4 py-2 text-left">Активна</th>
              <th className="border px-4 py-2 text-left">Дата создания</th>
              <th className="border px-4 py-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {list.map((q) => (
              <tr key={q.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{q.id}</td>
                <td className="border px-4 py-2">{q.title}</td>
                <td className="border px-4 py-2">{q.group_title || "—"}</td>
                <td className="border px-4 py-2">{q.is_active ? "Да" : "Нет"}</td>
                <td className="border px-4 py-2">
                  {new Date(q.created_at).toLocaleString("ru-RU")}
                </td>
                <td className="border px-4 py-2 space-x-2">
                  <Link href={`/admin/questionnaires/${q.id}/edit`}>
                    <button className="text-indigo-600 hover:underline">
                      Редактировать
                    </button>
                  </Link>
                  <Link href={`/admin/questionnaires/${q.id}`}>
                    <button className="text-blue-600 hover:underline">
                      Детали
                    </button>
                  </Link>
                  <DeleteQuestionnaireButton questionnaireId={q.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">Анкет не найдено.</p>
      )}
    </div>
  );
}
