"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

interface GroupOption {
  id: number;
  title: string;
}

export default function CreateQuestionnaireForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");
  const [result, setResult] = useState("");
  const [groupId, setGroupId] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Загружаем список групп (чтобы выбрать, куда привязать анкету)
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
    // purpose и result могут быть пустыми

    setLoading(true);

    try {
      const res = await fetch("/api/admin/questionnaires", {
        method: "POST",
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
        setError(text || "Не удалось создать анкету");
        setLoading(false);
        return;
      }

      const data = await res.json();
      // После создания переходим на страницу деталей новой анкеты
      router.push(`/admin/questionnaires/${data.id}`);
    } catch (networkError) {
      console.error("Ошибка при запросе:", networkError);
      setError("Не удалось создать анкету (сетевая ошибка)");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 min-h-screen">
      <div className="w-full max-w-lg bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-semibold mb-6">Создать новую анкету</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1"
            >
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
              className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Сохраняю..." : "Создать"}
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
      </div>
    </div>
  );
}
