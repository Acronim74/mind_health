// src/components/DeleteQuestionButton.tsx
"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";

interface DeleteQuestionButtonProps {
  questionnaireId: number;
  questionId: number;
}

const DeleteQuestionButton: FC<DeleteQuestionButtonProps> = ({
  questionnaireId,
  questionId,
}) => {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Удалить вопрос? Это действие необратимо.")) return;
    const res = await fetch(
      `/api/admin/questionnaires/${questionnaireId}/questions/${questionId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      // После удаления — обновляем страницу деталей анкеты
      router.refresh();
    } else {
      alert("Не удалось удалить вопрос");
    }
  };

  return (
    <button onClick={handleDelete} className="text-red-600 hover:underline">
      Удалить
    </button>
  );
};

export default DeleteQuestionButton;
