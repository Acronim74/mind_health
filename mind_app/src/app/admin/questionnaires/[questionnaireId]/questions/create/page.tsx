// src/app/admin/questionnaires/[questionnaireId]/questions/create/page.tsx

import CreateQuestionForm from "@/components/CreateQuestionForm";

interface PageParams {
  questionnaireId: string;
}

export default async function CreateQuestionPage({
  params,
}: {
  params: PageParams;
}) {
  // Читаем params синхронно, так как функция async
  const questionnaireId = Number(params.questionnaireId);

  return <CreateQuestionForm questionnaireId={questionnaireId} />;
}
