"use client";

import { FC, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

interface GroupOption {
  id: number;
  title: string;
}

interface EditQuestionnaireFormProps {
  questionnaireId: number;
  initialTitle: string;
  initialDescription: string;
  initialPurpose: string;
  initialResult: string;
  initialGroupId: number;
  initialIsActive: boolean;
}

const EditQuestionnaireForm: FC<EditQuestionnaireFormProps> = ({
  questionnaireId,
  initialTitle,
  initialDescription,
  initialPurpose,
  initialResult,
  initialGroupId,
  initialIsActive,
}) => {
  const router = useRouter();

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [purpose, setPurpose] = useState(initialPurpose);
  const [result, setResult] = useState(initialResult);
  const [groupId, setGroupId] = useState<number | "">(initialGroupId);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Загружаем список групп
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase
      .from<GroupOption>("groups")
      .select("id, title")
      .order("title", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("Ошибка при загрузке групп:", error);
          setError("Не удалось загрузить список групп");
        } else if (data) {
          setGroups(data);
        }
      });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length === 0) {
      setError("Название анкеты не может быть пустым");
      return;
    }
    if (groupId === "") {
      setError("Нужно выбрать группу");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/questionnaires/${questionnaireId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description,
          purpose,
          result,
          group_id: groupId,
          is_active: isActive,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || "Не удалось обновить анкету");
        setLoading(false);
        return;
      }

      // После успешного обновления — переходим на детали анкеты
      router.push(`/admin/questionnaires/${questionnaireId}`);
    } catch (networkError) {
      console.error("Ошибка при запросе:", networkError);
      setError("Не удалось обновить анкету (сетевая ошибка)");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Название анкеты */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Название анкеты
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

      {/* Описание анкеты */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Описание анкеты (опционально)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Цель анкеты */}
      <div>
        <label htmlFor="purpose" className="block text-sm font-medium mb-1">
          Цель анкеты
        </label>
        <textarea
          id="purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Результат прохождения анкеты */}
      <div>
        <label htmlFor="result" className="block text-sm font-medium mb-1">
          Результат прохождения анкеты
        </label>
        <textarea
          id="result"
          value={result}
          onChange={(e) => setResult(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Выбор группы */}
      <div>
        <label htmlFor="group" className="block text-sm font-medium mb-1">
          Группа
        </label>
        <select
          id="group"
          value={groupId}
          onChange={(e) => setGroupId(Number(e.target.value))}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">– Выберите группу –</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </div>

      {/* Активность */}
      <div className="flex items-center space-x-2">
        <input
          id="is_active"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
        />
        <label htmlFor="is_active" className="text-sm">
          Активная
        </label>
      </div>

      {/* Кнопки */}
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
          onClick={() => router.push("/admin/questionnaires")}
          className="text-gray-600 hover:underline"
        >
          Отмена
        </button>
      </div>
    </form>
  );
};

export default EditQuestionnaireForm;
