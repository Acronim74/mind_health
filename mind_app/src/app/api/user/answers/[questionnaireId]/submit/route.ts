// src/app/api/user/answers/[questionnaireId]/submit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Configuration, OpenAIApi } from "openai";
import * as jose from "jose";

async function verifyJwt(token: string) {
  const { payload } = await jose.jwtVerify(
    token!,
    new TextEncoder().encode(process.env.JWT_SECRET!)
  );
  return payload as { sub: string; role: string };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { questionnaireId: string } }
) {
  const token = request.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  let payload;
  try {
    payload = await verifyJwt(token);
  } catch {
    return NextResponse.json({ error: "Неверный токен" }, { status: 401 });
  }
  const userId = payload.sub;
  const questionnaireId = Number(params.questionnaireId);

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1) Отмечаем отправку
  const { data: ua, error: uaErr } = await supabase
    .from("user_answers")
    .select("id")
    .eq("user_id", userId)
    .eq("questionnaire_id", questionnaireId)
    .eq("is_submitted", false)
    .maybeSingle();
  if (uaErr || !ua) {
    return NextResponse.json({ error: "Черновик не найден" }, { status: 404 });
  }
  await supabase
    .from("user_answers")
    .update({ is_submitted: true, updated_at: new Date().toISOString() })
    .eq("id", ua.id);

  // 2) Загружаем детали ответов
  const { data: answers, error: aErr } = await supabase
    .from("user_answer_details")
    .select(`question_id, answer_text, answer_choice, answer_number, 
              questions:text`)
    .eq("user_answer_id", ua.id);
  if (aErr) {
    console.error("Ошибка загрузки ответов:", aErr);
    return NextResponse.json({ error: "Не удалось получить ответы" }, { status: 500 });
  }

  // 3) Формируем промпт для OpenAI
  let prompt = `Проанализируй ответы пользователя на анкету (ID ${questionnaireId}):\n\n`;
  for (const row of answers!) {
    const questionText = (row as any).text || `Вопрос ${row.question_id}`;
    prompt += `Вопрос: ${questionText}\nОтвет: ${
      row.answer_text ??
      (row.answer_choice 
        ? JSON.stringify(row.answer_choice) 
        : row.answer_number)
    }\n\n`;
  }
  prompt += `Дай подробный анализ и рекомендации.`;

  // 4) Вызов OpenAI
  const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY!
  }));
  let analysisText: string;
  try {
    const resp = await openai.createCompletion({
      model: "gpt-4",
      prompt,
      max_tokens: 500,
      temperature: 0.7,
    });
    analysisText = resp.data.choices[0].text?.trim() || "Без ответа от AI.";
  } catch (err) {
    console.error("OpenAI error:", err);
    analysisText = "Не удалось получить анализ от AI.";
  }

  // 5) Сохраняем анализ в базе
  const { error: insErr } = await supabase
    .from("user_answer_analysis")
    .insert({
      user_answer_id: ua.id,
      analysis_text: analysisText,
    });
  if (insErr) {
    console.error("Ошибка сохранения анализа:", insErr);
  }

  return NextResponse.json({ success: true });
}
