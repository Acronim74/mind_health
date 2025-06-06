// src/components/DeleteUserButton.tsx

"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";

interface DeleteUserButtonProps {
  userId: string;
}

const DeleteUserButton: FC<DeleteUserButtonProps> = ({ userId }) => {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errText = await res.text();
        alert(errText || "Не удалось удалить пользователя");
        return;
      }
      // Обновить текущую страницу после успешного удаления
      router.refresh();
    } catch (error) {
      console.error("Ошибка при удалении пользователя:", error);
      alert("Ошибка при удалении пользователя");
    }
  };

  return (
    <button onClick={handleDelete} className="text-red-600 hover:underline">
      Удалить
    </button>
  );
};

export default DeleteUserButton;
