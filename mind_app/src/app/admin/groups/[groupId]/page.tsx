// src/app/admin/groups/[groupId]/page.tsx
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Group {
  id: number;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

interface Questionnaire {
  id: number;
  title: string;
}

interface PageParams {
  groupId: string;
}

// Server Component, отвечает за получение данных группы и связанных анкет
export default async function GroupDetailsPage({ params }: { params: PageParams }) {
  const groupId = Number(params.groupId);

  // Инициализируем Supabase-клиент на сервере
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1) Забираем данные о группе
  const { data: group, error: groupError } = await supabase
    .from<Group>("groups")
    .select("id, title, description, created_by, created_at")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    // Если группа не найдена или ошибка — показываем 404
    return notFound();
  }

  // 2) Забираем все анкеты, привязанные к этой группе
  const { data: questionnaires, error: qError } = await supabase
    .from<Questionnaire>("questionnaires")
    .select("id, title")
    .eq("group_id", groupId)
    .order("id", { ascending: true });

  // Если ошибка при получении анкет — оставляем пустой список, но не 404
  const related = questionnaires || [];

  return (
    <div className="p-8">
      {/* Навигация: назад в список групп и кнопка «Редактировать» */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/admin/groups">
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-4">
              ← К списку групп
            </button>
          </Link>
          <span className="text-2xl font-semibold">Детали группы</span>
        </div>
        <Link href={`/admin/groups/${group.id}/edit`}>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Редактировать
          </button>
        </Link>
      </div>

      {/* Информация о группе */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h3 className="text-xl font-semibold mb-2">{group.title}</h3>
        <p className="mb-4 text-gray-700">
          {group.description || "Описание отсутствует"}
        </p>
        <div className="text-sm text-gray-600 space-x-4">
          <span>
            Создана:{" "}
            {new Date(group.created_at).toLocaleString("ru-RU", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span>Автор: {group.created_by}</span>
        </div>
      </div>

      {/* Список анкет группы */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold mb-4">Анкеты в группе</h4>
        {related.length > 0 ? (
          <ul className="space-y-2">
            {related.map((q) => (
              <li key={q.id} className="flex justify-between items-center">
                <span>{q.title}</span>
                <div className="space-x-2">
                  <Link href={`/admin/questionnaires/${q.id}/edit`}>
                    <button className="text-indigo-600 hover:underline">Редактировать</button>
                  </Link>
                  <Link href={`/admin/questionnaires/${q.id}`}>
                    <button className="text-blue-600 hover:underline">Детали</button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Анкет в этой группе ещё нет.</p>
        )}
      </div>
    </div>
  );
}
