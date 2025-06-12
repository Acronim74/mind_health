// src/app/dashboard/questionnaires/[questionnaireId]/start/page.tsx

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";
import QuestionnaireWizard from "@/components/QuestionnaireWizard";

interface JwtPayload {
  sub: string;
  role: string;
}

interface Question {
  id: number;
  text: string;
  type: string;
  is_required: boolean;
  order_index: number;
}

interface AnswerDetail {
  question_id: number;
  answer_text: string | null;
  answer_choice: any;
  answer_number: number | null;
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

export default async function StartQuestionnairePage({
  params,
}: {
  params: PageParams;
}) {
  // 1) await params
  const { questionnaireId: qIdStr } = await params;
  const questionnaireId = Number(qIdStr);

  // 2) await cookies()
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("token")?.value;
  if (!tokenCookie) redirect("/login");

  // 3) verify JWT
  let payload: JwtPayload;
  try {
    payload = await verifyJwt(tokenCookie);
  } catch {
    redirect("/login");
  }
  const userId = payload.sub;

  // 4) init supabase
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 5) load questions
  const { data: questionsData, error: qErr } = await supabase
    .from<Question>("questions")
    .select("id, text, type, is_required, order_index")
    .eq("questionnaire_id", questionnaireId)
    .order("order_index", { ascending: true });
  if (qErr) {
    console.error("Ошибка загрузки вопросов:", qErr);
    return <p className="p-8 text-red-500">Не удалось загрузить вопросы.</p>;
  }
  const questions = questionsData || [];

  // 6) load draft
  const { data: ua, error: uaErr } = await supabase
    .from("user_answers")
    .select("id")
    .eq("user_id", userId)
    .eq("questionnaire_id", questionnaireId)
    .eq("is_submitted", false)
    .maybeSingle();
  if (uaErr) {
    console.error("Ошибка загрузки черновика:", uaErr);
    return <p className="p-8 text-red-500">Не удалось загрузить черновик.</p>;
  }

  let existingAnswers: AnswerDetail[] = [];
  let userAnswerId: string | null = null;
  if (ua) {
    userAnswerId = ua.id;
    const { data: details, error: dErr } = await supabase
      .from<AnswerDetail>("user_answer_details")
      .select("question_id, answer_text, answer_choice, answer_number")
      .eq("user_answer_id", ua.id);
    if (dErr) {
      console.error("Ошибка загрузки деталей ответов:", dErr);
      return <p className="p-8 text-red-500">Не удалось загрузить ответы.</p>;
    }
    existingAnswers = details || [];
  }

  return (
    <QuestionnaireWizard
      questionnaireId={questionnaireId}
      questions={questions}
      existingAnswers={existingAnswers}
      userAnswerId={userAnswerId}
    />
  );
}
