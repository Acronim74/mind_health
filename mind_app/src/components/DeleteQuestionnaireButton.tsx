// src/components/DeleteQuestionnaireButton.tsx
"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";

interface DeleteQuestionnaireButtonProps {
  questionnaireId: number;
}

const DeleteQuestionnaireButton: FC<DeleteQuestionnaireButtonProps> = ({ questionnaireId }) => {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Удалить анкету? Это действие необратимо и удалит все связанные вопросы!")) return;
    const res = await fetch(`/api/admin/questionnaires/${questionnaireId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/questionnaires");
    } else {
      alert("Не удалось удалить анкету");
    }
  };

  return (
    <button onClick={handleDelete} className="text-red-600 hover:underline">
      Удалить
    </button>
  );
};

export default DeleteQuestionnaireButton;
