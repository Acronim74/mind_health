// src/app/admin/questionnaires/[questionnaireId]/edit/page.tsx

import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import EditQuestionnaireForm from "@/components/EditQuestionnaireForm";

interface Questionnaire {
  id: number;
  title: string;
  description: string | null;
  purpose: string | null;
  result: string | null;
  group_id: number;
  is_active: boolean;
}

interface PageParams {
  questionnaireId: string;
}

export default async function EditQuestionnairePage({
  params,
}: {
  params: PageParams;
}) {
  const questionnaireId = Number(params.questionnaireId);

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1) Получаем текущие данные анкеты
  const { data: questionnaire, error } = await supabase
    .from<Questionnaire>("questionnaires")
    .select("id, title, description, purpose, result, group_id, is_active")
    .eq("id", questionnaireId)
    .single();

  if (error || !questionnaire) {
    return notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 min-h-screen">
      <div className="w-full max-w-lg bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-semibold mb-6">Редактировать анкету</h2>
        <EditQuestionnaireForm
          questionnaireId={questionnaire.id}
          initialTitle={questionnaire.title}
          initialDescription={questionnaire.description || ""}
          initialPurpose={questionnaire.purpose || ""}
          initialResult={questionnaire.result || ""}
          initialGroupId={questionnaire.group_id}
          initialIsActive={questionnaire.is_active}
        />
      </div>
    </div>
  );
}
