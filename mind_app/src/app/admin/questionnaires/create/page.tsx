// src/app/admin/questionnaires/create/page.tsx

import CreateQuestionnaireForm from "@/components/CreateQuestionnaireForm";

// Это серверный компонент (нет "use client")
// Он просто берёт questionnaireId из params и передаёт его в клиентскую форму.
// Поскольку здесь id не нужен (это создание новой анкеты), мы просто рендерим форму.
export default function CreateQuestionnairePage() {
  return <CreateQuestionnaireForm />;
}
