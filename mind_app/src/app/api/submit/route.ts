// src/app/api/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Configuration, OpenAIApi } from "openai";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, questionnaire_id, answers } = body;

    if (!user_id || !questionnaire_id || !answers) {
      return NextResponse.json({ error: "Недостаточно данных." }, { status: 400 });
    }

    // Сохраняем каждый ответ
    const inserts = answers.map((ans: any) => ({
      user_id,
      questionnaire_id,
      question_id: ans.question_id,
      answer: ans.answer,
    }));

    const { error } = await supabase.from("answers").insert(inserts);
    if (error) {
      return NextResponse.json({ error: "Ошибка при сохранении ответов." }, { status: 500 });
    }

    // Получаем промт для анкеты
    const { data: questionnairePromptData } = await supabase
      .from("questionnaires")
      .select("prompt_role, prompt_tone, prompt_goal")
      .eq("id", questionnaire_id)
      .single();

    const prompt = `Роль: ${questionnairePromptData?.prompt_role || "аналитик"}
Тональность: ${questionnairePromptData?.prompt_tone || "нейтральная"}
Цель: ${questionnairePromptData?.prompt_goal || "сделай краткий анализ ответов"}

Ответы:
${answers.map((a: any) => `Вопрос: ${a.question_text}\nОтвет: ${a.answer}`).join("\n\n")}`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: prompt },
      ],
    });

    const analysis = completion.data.choices[0]?.message?.content || "";

    // Сохраняем анализ
    await supabase.from("analyses").insert({
      user_id,
      questionnaire_id,
      analysis,
    });

    return NextResponse.json({ success: true, analysis });
  } catch (err) {
    console.error("Ошибка анализа:", err);
    return NextResponse.json({ error: "Не удалось выполнить анализ." }, { status: 500 });
  }
}
