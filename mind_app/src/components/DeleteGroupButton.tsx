// src/components/DeleteGroupButton.tsx
"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";

interface DeleteGroupButtonProps {
  groupId: number;
}

const DeleteGroupButton: FC<DeleteGroupButtonProps> = ({ groupId }) => {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Удалить группу? Это действие необратимо.")) return;
    const res = await fetch(`/api/admin/groups/${groupId}`, { method: "DELETE" });
    if (res.ok) {
      // Чтобы обновить страницу после удаления (Server Component),
      // достаточно принудительно перезагрузить её:
      router.refresh();
    } else {
      alert("Не удалось удалить группу");
    }
  };

  return (
    <button onClick={handleDelete} className="text-red-600 hover:underline">
      Удалить
    </button>
  );
};

export default DeleteGroupButton;
