// src/components/admin/QuestionnaireSettings.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch"; // адаптируйте импорт под вашу библиотеку

interface Props {
  questionnaireId: number;
}

export default function QuestionnaireSettings({ questionnaireId }: Props) {
  const router = useRouter();
  const [useAI, setUseAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // При монтировании загружаем текущее значение
  useEffect(() => {
    fetch(`/api/admin/questionnaires/${questionnaireId}/settings`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.role_text !== undefined) {
          // settings exist, use a promt flag
          // если записей нет, data === null
          // можно считать, что use_ai false
        }
        // Дополнительно можно fetch флаг use_ai_analysis из самой таблицы
        fetch(`/api/admin/questionnaires/${questionnaireId}`, { method: "GET" })
          .then((r) => r.json())
          .then((q) => {
            setUseAI(q.use_ai_analysis);
          });
      })
      .catch(console.error);
  }, [questionnaireId]);

  const toggleAI = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/questionnaires/${questionnaireId}/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ use_ai_analysis: !useAI }),
        }
      );
      if (!res.ok) throw new Error("Ошибка при сохранении параметра AI");
      setUseAI(!useAI);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold mb-2">Параметры анализа</h3>
      <div className="flex items-center space-x-3">
        <Switch
          checked={useAI}
          onCheckedChange={toggleAI}
          disabled={loading}
        />
        <label>Анализ через ИИ</label>
      </div>
      {useAI && (
        <button
          onClick={() => router.push(`/admin/questionnaires/${questionnaireId}/prompt`)}
          className="mt-4 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded"
        >
          Настроить промт ИИ
        </button>
      )}
      {error && <p className="mt-2 text-red-500">{error}</p>}
    </div>
  );
}
