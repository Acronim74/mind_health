// src/components/QuestionnaireWizard.tsx

"use client";

import { FC, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: number;
  text: string;
  type: string;       // "text" | "single-choice" | "multiple-choice" | "number"
  is_required: boolean;
  order_index: number;
}

interface AnswerDetail {
  question_id: number;
  answer_text: string | null;
  answer_choice: any;
  answer_number: number | null;
}

interface QuestionnaireWizardProps {
  questionnaireId: number;
  questions: Question[];
  existingAnswers: AnswerDetail[];
  userAnswerId: string | null;
}

const QuestionnaireWizard: FC<QuestionnaireWizardProps> = ({
  questionnaireId,
  questions,
  existingAnswers,
  userAnswerId,
}) => {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [answers, setAnswers] = useState<Record<
    number,
    { answer_text?: string; answer_choice?: any; answer_number?: number }
  >>(() => {
    const init: any = {};
    existingAnswers.forEach((a) => {
      init[a.question_id] = {
        answer_text: a.answer_text ?? "",
        answer_choice: a.answer_choice ?? null,
        answer_number: a.answer_number ?? null,
      };
    });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = questions[currentIdx];

  const handleNext = () => {
    // валидировать текущий
    if (q.is_required) {
      const resp = answers[q.id];
      const empty =
        q.type === "text"
          ? !(resp?.answer_text?.trim())
          : q.type === "number"
          ? resp?.answer_number == null
          : resp == null;
      if (empty) {
        setError("Это поле обязательно");
        return;
      }
    }
    setError(null);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      // достигли конца — показать сводку
      setShowSummary(true);
    }
  };

  const handlePrev = () => {
    setError(null);
    if (showSummary) {
      // выход из сводки в последний вопрос
      setShowSummary(false);
      setCurrentIdx(questions.length - 1);
    } else if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
    }
  };

  const onChange = (data: any) => {
    setAnswers((a) => ({ ...a, [q.id]: data }));
  };

  const saveAnswers = async (): Promise<string> => {
    const payload = questions.map((ques) => {
      const resp = answers[ques.id] || {};
      return {
        question_id: ques.id,
        answer_text: resp.answer_text ?? null,
        answer_choice: resp.answer_choice ?? null,
        answer_number: resp.answer_number ?? null,
      };
    });
    const res = await fetch("/api/user/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionnaire_id: questionnaireId, user_answer_id: userAnswerId, answers: payload }),
    });
    const data = await res.json();
    if (!res.ok || !data.user_answer_id) {
      throw new Error(data.error || "Ошибка сохранения");
    }
    return data.user_answer_id;
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const uaId = await saveAnswers();
      // вызвать submit
      const res = await fetch(
        `/api/user/answers/${questionnaireId}/submit`,
        { method: "PATCH" }
      );
      if (!res.ok) throw new Error("Не удалось отправить анкету");
      // всё успешно — возвращаемся в кабинет
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ошибка при отправке");
      setLoading(false);
    }
  };

  // если показываем сводку:
  if (showSummary) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-xl bg-white p-8 rounded shadow space-y-6">
          <h2 className="text-2xl font-semibold">Проверьте ваши ответы</h2>
          {error && <p className="text-red-500">{error}</p>}
          <div className="space-y-4">
            {questions.map((ques, idx) => {
              const a = answers[ques.id];
              let display: React.ReactNode;
              if (!a) display = <span className="text-red-500">Нет ответа</span>;
              else if (ques.type === "text") display = <p className="whitespace-pre-line">{a.answer_text}</p>;
              else if (ques.type === "number") display = <p>{a.answer_number}</p>;
              else display = <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(a.answer_choice)}</pre>;
              return (
                <div key={ques.id} className="border-b pb-2">
                  <div className="flex justify-between">
                    <h4 className="font-medium">{idx+1}. {ques.text}</h4>
                    <button
                      className="text-indigo-600 hover:underline"
                      onClick={() => { setShowSummary(false); setCurrentIdx(idx); }}
                    >Изменить</button>
                  </div>
                  {display}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between">
            <button
              onClick={handlePrev}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            >Назад</button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`px-4 py-2 ${loading ? 'bg-green-300' : 'bg-green-500 hover:bg-green-600 text-white'} rounded disabled:opacity-50`}
            >{loading ? 'Отправка...' : 'Отправить анкету'}</button>
          </div>
        </div>
      </div>
    );
  }

  // стандартный вид вопроса
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <form className="w-full max-w-xl bg-white p-8 rounded shadow space-y-6">
        <h2 className="text-2xl font-semibold">Вопрос {currentIdx + 1} из {questions.length}</h2>
        {error && <p className="text-red-500">{error}</p>}
        <div>
          <label className="block mb-2 font-medium">{q.text}</label>
          {q.type === "text" && (
            <textarea
              rows={4}
              value={answers[q.id]?.answer_text || ""}
              onChange={(e) => onChange({ answer_text: e.target.value })}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}
          {q.type === "number" && (
            <input
              type="number"
              value={answers[q.id]?.answer_number ?? ""}
              onChange={(e) => onChange({ answer_number: Number(e.target.value) })}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}
          {(q.type === "single-choice" || q.type === "multiple-choice") && (
            <textarea
              rows={2}
              placeholder="Введите вариант(ы) ответа"
              value={answers[q.id]?.answer_choice || ""}
              onChange={(e) => onChange({ answer_choice: e.target.value })}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}
        </div>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
          >Назад</button>
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >{currentIdx < questions.length - 1 ? 'Далее' : 'Посмотреть ответы'}</button>
        </div>
      </form>
    </div>
  );
};

export default QuestionnaireWizard;
