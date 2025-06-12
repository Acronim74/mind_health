// src/app/dashboard/questionnaires/[questionnaireId]/review/page.tsx

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import * as jose from "jose";

interface JwtPayload {
  sub: string;
  role: string;
}

interface QuestionDetail {
  id: number;
  text: string;
  type: string;
}

interface AnswerDetail {
  question_id: number;
  answer_text: string | null;
  answer_choice: any;
  answer_number: number | null;
}

interface AnalysisRow {
  analysis_text: string;
}

interface PageParams {
  questionnaireId: string;
}

async function verifyJwt(token: string): Promise<JwtPayload> {
  const { payload } = await jose.jwtVerify(
    token,
    new TextEncoder().encode(process.env.JWT_SECRET!)
  );
  return payload as JwtPayload;
}

export default async function ReviewPage({
  params,
}: {
  params: PageParams;
}) {
  // 1) await params
  const { questionnaireId: qIdStr } = await params;
  const questionnaireId = Number(qIdStr);

  // 2) await cookies()
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  // 3) verify JWT
  let payload: JwtPayload;
  try {
    payload = await verifyJwt(token);
  } catch {
    redirect("/login");
  }
  const userId = payload.sub;

  // 4) init supabase
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 5) load submitted session
  const { data: ua, error: uaErr } = await supabase
    .from("user_answers")
    .select("id")
    .eq("user_id", userId)
    .eq("questionnaire_id", questionnaireId)
    .eq("is_submitted", true)
    .maybeSingle();
  if (uaErr) {
    console.error("Ошибка поиска отправленной анкеты:", uaErr);
    return notFound();
  }
  if (!ua) {
    return redirect(`/dashboard/questionnaires/${questionnaireId}/start`);
  }
  const userAnswerId = ua.id;

  // 6) load questions
  const { data: questions, error: qErr } = await supabase
    .from<QuestionDetail>("questions")
    .select("id, text, type")
    .eq("questionnaire_id", questionnaireId)
    .order("order_index", { ascending: true });
  if (qErr) {
    console.error("Ошибка загрузки вопросов:", qErr);
    return notFound();
  }

  // 7) load answers
  const { data: answers, error: aErr } = await supabase
    .from<AnswerDetail>("user_answer_details")
    .select("question_id, answer_text, answer_choice, answer_number")
    .eq("user_answer_id", userAnswerId);
  if (aErr) {
    console.error("Ошибка загрузки ответов пользователя:", aErr);
    return notFound();
  }
  const answerMap = new Map(answers.map((a) => [a.question_id, a]));

  // 8) load analysis
  const { data: analy, error: anErr } = await supabase
    .from<AnalysisRow>("user_answer_analysis")
    .select("analysis_text")
    .eq("user_answer_id", userAnswerId)
    .maybeSingle();
  const analysisText = !anErr && analy ? analy.analysis_text : null;

  // 9) render
  return (
    <div className="p-8 space-y-6">
      <Link href={`/dashboard/questionnaires/${questionnaireId}/start`}>
        <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
          ← Редактировать ответы
        </button>
      </Link>

      <h2 className="text-2xl font-semibold">Ваши ответы</h2>
      <div className="bg-white p-6 rounded shadow space-y-4">
        {questions.map((q) => {
          const a = answerMap.get(q.id);
          let display: React.ReactNode;
          if (!a) {
            display = <span className="text-red-500">Нет ответа</span>;
          } else if (q.type === "text") {
            display = <p className="whitespace-pre-line">{a.answer_text}</p>;
          } else if (q.type === "number") {
            display = <p>{a.answer_number}</p>;
          } else {
            display = (
              <pre className="bg-gray-100 p-2 rounded">
                {JSON.stringify(a.answer_choice, null, 2)}
              </pre>
            );
          }
          return (
            <div key={q.id}>
              <h4 className="font-medium">{q.text}</h4>
              {display}
            </div>
          );
        })}
      </div>

      <h2 className="text-2xl font-semibold">AI-анализ</h2>
      {analysisText ? (
        <div className="bg-white p-6 rounded shadow">
          <p className="whitespace-pre-line">{analysisText}</p>
        </div>
      ) : (
        <p className="text-gray-500">Анализ пока не готов.</p>
      )}
    </div>
  );
}
