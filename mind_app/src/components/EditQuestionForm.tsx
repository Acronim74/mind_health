"use client";

import { FC, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface EditQuestionFormProps {
  questionnaireId: number;
  questionId: number;
  initialText: string;
  initialType: string;
  initialIsRequired: boolean;
  initialOrderIndex: number;
}

const EditQuestionForm: FC<EditQuestionFormProps> = ({
  questionnaireId,
  questionId,
  initialText,
  initialType,
  initialIsRequired,
  initialOrderIndex,
}) => {
  const router = useRouter();

  const [text, setText] = useState(initialText);
  const [type, setType] = useState(initialType);
  const [isRequired, setIsRequired] = useState(initialIsRequired);
  const [orderIndex, setOrderIndex] = useState<number>(initialOrderIndex);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (text.trim().length === 0) {
      setError("Текст вопроса не может быть пустым");
      return;
    }
    if (type.trim().length === 0) {
      setError("Нужно указать тип вопроса");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/admin/questionnaires/${questionnaireId}/questions/${questionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text.trim(),
            type: type.trim(),
            is_required: isRequired,
            order_index: orderIndex,
          }),
        }
      );

      if (!res.ok) {
        const textErr = await res.text();
        setError(textErr || "Не удалось обновить вопрос");
        setLoading(false);
        return;
      }

      // После успешного обновления — переходим к деталям вопроса
      router.push(
        `/admin/questionnaires/${questionnaireId}/questions/${questionId}`
      );
    } catch (networkError) {
      console.error("Ошибка при запросе:", networkError);
      setError("Не удалось обновить вопрос (сетевая ошибка)");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Текст вопроса */}
      <div>
        <label htmlFor="text" className="block text-sm font-medium mb-1">
          Текст вопроса
        </label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Тип вопроса */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium mb-1">
          Тип вопроса
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="text">Текстовый ответ</option>
          <option value="single-choice">Один вариант</option>
          <option value="multiple-choice">Несколько вариантов</option>
          <option value="number">Числовая шкала</option>
        </select>
      </div>

      {/* Обязательный */}
      <div className="flex items-center space-x-2">
        <input
          id="is_required"
          type="checkbox"
          checked={isRequired}
          onChange={(e) => setIsRequired(e.target.checked)}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
        />
        <label htmlFor="is_required" className="text-sm">
          Обязательный
        </label>
      </div>

      {/* Порядковый индекс */}
      <div>
        <label htmlFor="order_index" className="block text-sm font-medium mb-1">
          Порядковый индекс (число)
        </label>
        <input
          id="order_index"
          type="number"
          value={orderIndex}
          onChange={(e) => setOrderIndex(Number(e.target.value))}
          min={0}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
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
          onClick={() =>
            router.push(`/admin/questionnaires/${questionnaireId}`)
          }
          className="text-gray-600 hover:underline"
        >
          Отмена
        </button>
      </div>
    </form>
  );
};

export default EditQuestionForm;
