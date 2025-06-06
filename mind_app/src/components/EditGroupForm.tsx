// src/components/EditGroupForm.tsx
"use client";

import { FC, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface EditGroupFormProps {
  initialTitle: string;
  initialDescription: string;
  groupId: number;
}

const EditGroupForm: FC<EditGroupFormProps> = ({
  initialTitle,
  initialDescription,
  groupId,
}) => {
  const router = useRouter();

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length === 0) {
      setError("Название группы не может быть пустым");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || "Не удалось обновить группу");
        setLoading(false);
        return;
      }

      // При успешном обновлении — переходим к деталям группы
      router.push(`/admin/groups/${groupId}`);
    } catch (networkError) {
      console.error("Ошибка при запросе:", networkError);
      setError("Не удалось обновить группу (сетевая ошибка)");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Название группы
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Описание (опционально)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex justify-between items-center">
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Сохраняю..." : "Сохранить"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/groups")}
          className="text-gray-600 hover:underline"
        >
          Отмена
        </button>
      </div>
    </form>
  );
};

export default EditGroupForm;
