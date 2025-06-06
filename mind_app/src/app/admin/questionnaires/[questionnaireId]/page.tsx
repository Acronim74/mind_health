// src/app/admin/questionnaires/[questionnaireId]/page.tsx

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteQuestionButton from "@/components/DeleteQuestionButton";

interface Questionnaire {
  id: number;
  title: string;
  description: string | null;
  purpose: string | null;
  result: string | null;
  group_id: number;
  group_title: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

interface Question {
  id: number;
  text: string;
  type: string;
  is_required: boolean;
}

interface PageParams {
  questionnaireId: string;
}

export default async function QuestionnaireDetailsPage({
  params,
}: {
  params: PageParams;
}) {
  // Обратите внимание: функция объявлена async — теперь params доступен синхронно
  const questionnaireId = Number(params.questionnaireId);

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1) Получаем данные анкеты с JOIN на таблицу groups
  const { data: questionnaire, error: qErr } = await supabase
    .from<Questionnaire>("questionnaires")
    .select(`
      id,
      title,
      description,
      purpose,
      result,
      group_id,
      is_active,
      created_by,
      created_at,
      groups ( title )
    `)
    .eq("id", questionnaireId)
    .single();

  if (qErr || !questionnaire) {
    return notFound();
  }

  // 2) Получаем список вопросов, которые относятся к этой анкете
  const { data: questions, error: quesErr } = await supabase
    .from<Question>("questions")
    .select("id, text, type, is_required")
    .eq("questionnaire_id", questionnaireId)
    .order("id", { ascending: true });

  const relatedQuestions = questions || [];

  return (
    <div className="p-8">
      {/* Навигация: «← К списку анкет» и кнопка «Редактировать» */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/admin/questionnaires">
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-4">
              ← К списку анкет
            </button>
          </Link>
          <span className="text-2xl font-semibold">Детали анкеты</span>
        </div>
        <Link href={`/admin/questionnaires/${questionnaire.id}/edit`}>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Редактировать
          </button>
        </Link>
      </div>

      {/* Информация об анкете */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h3 className="text-xl font-semibold mb-2">{questionnaire.title}</h3>

        <p className="mb-4 text-gray-700">
          <span className="font-medium">Описание:</span>{" "}
          {questionnaire.description || "– отсутствует –"}
        </p>

        <p className="mb-4 text-gray-700">
          <span className="font-medium">Цель:</span>{" "}
          {questionnaire.purpose || "– отсутствует –"}
        </p>

        <p className="mb-4 text-gray-700">
          <span className="font-medium">Результат:</span>{" "}
          {questionnaire.result || "– отсутствует –"}
        </p>

        <div className="text-sm text-gray-600 space-x-4 mb-4">
          <span>Группа: {questionnaire.groups?.title || "–"}</span>
          <span>Активна: {questionnaire.is_active ? "Да" : "Нет"}</span>
        </div>

        <div className="text-sm text-gray-600">
          <span>
            Создана:{" "}
            {new Date(questionnaire.created_at).toLocaleString("ru-RU", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="ml-6">Автор: {questionnaire.created_by}</span>
        </div>
      </div>

      {/* Список вопросов в этой анкете */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">Вопросы анкеты</h4>
          <Link href={`/admin/questionnaires/${questionnaireId}/questions/create`}>
            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
              Добавить вопрос
            </button>
          </Link>
        </div>
        {relatedQuestions.length > 0 ? (
          <table className="w-full table-auto border-collapse shadow">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">ID</th>
                <th className="border px-4 py-2 text-left">Текст вопроса</th>
                <th className="border px-4 py-2 text-left">Тип</th>
                <th className="border px-4 py-2 text-left">Обязательный</th>
                <th className="border px-4 py-2 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {relatedQuestions.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{q.id}</td>
                  <td className="border px-4 py-2">{q.text}</td>
                  <td className="border px-4 py-2">{q.type}</td>
                  <td className="border px-4 py-2">
                    {q.is_required ? "Да" : "Нет"}
                  </td>
                  <td className="border px-4 py-2 space-x-2">
                    <Link
                      href={`/admin/questionnaires/${questionnaireId}/questions/${q.id}/edit`}
                    >
                      <button className="text-indigo-600 hover:underline">
                        Редактировать
                      </button>
                    </Link>
                    <Link
                      href={`/admin/questionnaires/${questionnaireId}/questions/${q.id}`}
                    >
                      <button className="text-blue-600 hover:underline">
                        Детали
                      </button>
                    </Link>
                    <DeleteQuestionButton
                      questionnaireId={questionnaireId}
                      questionId={q.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">Вопросов в этой анкете ещё нет.</p>
        )}
      </div>
    </div>
  );
}
