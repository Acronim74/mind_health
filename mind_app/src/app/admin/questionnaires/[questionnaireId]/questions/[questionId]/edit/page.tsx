// src/app/admin/questionnaires/[questionnaireId]/questions/[questionId]/edit/page.tsx

import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import EditQuestionForm from "@/components/EditQuestionForm";

interface Question {
  id: number;
  questionnaire_id: number;
  text: string;
  type: string;
  is_required: boolean;
  order_index: number;
}

interface PageParams {
  questionnaireId: string;
  questionId: string;
}

export default async function EditQuestionPage({ params }: { params: PageParams }) {
  const questionnaireId = Number(params.questionnaireId);
  const questionId = Number(params.questionId);

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Получаем текущие данные вопроса
  const { data: question, error } = await supabase
    .from<Question>("questions")
    .select("id, questionnaire_id, text, type, is_required, order_index")
    .eq("id", questionId)
    .single();

  if (error || !question || question.questionnaire_id !== questionnaireId) {
    return notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 min-h-screen">
      <div className="w-full max-w-lg bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-semibold mb-6">Редактировать вопрос</h2>
        <EditQuestionForm
          questionnaireId={questionnaireId}
          questionId={question.id}
          initialText={question.text}
          initialType={question.type}
          initialIsRequired={question.is_required}
          initialOrderIndex={question.order_index}
        />
      </div>
    </div>
  );
}
