// src/app/admin/questionnaires/[questionnaireId]/questions/[questionId]/page.tsx

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Question {
  id: number;
  questionnaire_id: number;
  text: string;
  type: string;
  is_required: boolean;
  order_index: number;
  created_at: string;
}

interface PageParams {
  questionnaireId: string;
  questionId: string;
}

export default async function QuestionDetailsPage({
  params,
}: {
  params: PageParams;
}) {
  // Функция async, params уже «разрешён»
  const questionnaireId = Number(params.questionnaireId);
  const questionId = Number(params.questionId);

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Получаем вопрос и проверяем его принадлежность к нужной анкете
  const { data: question, error } = await supabase
    .from<Question>("questions")
    .select("id, questionnaire_id, text, type, is_required, order_index, created_at")
    .eq("id", questionId)
    .single();

  if (error || !question || question.questionnaire_id !== questionnaireId) {
    return notFound();
  }

  return (
    <div className="p-8">
      {/* Навигация: «← К деталям анкеты» и «Редактировать» */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href={`/admin/questionnaires/${questionnaireId}`}>
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-4">
              ← К деталям анкеты
            </button>
          </Link>
          <span className="text-2xl font-semibold">Детали вопроса</span>
        </div>
        <Link
          href={`/admin/questionnaires/${questionnaireId}/questions/${questionId}/edit`}
        >
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Редактировать
          </button>
        </Link>
      </div>

      {/* Данные о вопросе */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h3 className="text-xl font-semibold mb-2">Вопрос #{question.id}</h3>
        <p className="mb-4 text-gray-700">
          <span className="font-medium">Текст:</span> {question.text}
        </p>
        <p className="mb-4 text-gray-700">
          <span className="font-medium">Тип:</span> {question.type}
        </p>
        <p className="mb-4 text-gray-700">
          <span className="font-medium">Обязательный:</span>{" "}
          {question.is_required ? "Да" : "Нет"}
        </p>
        <p className="mb-4 text-gray-700">
          <span className="font-medium">Порядковый индекс:</span> {question.order_index}
        </p>
        <p className="text-sm text-gray-600">
          Создан:{" "}
          {new Date(question.created_at).toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
