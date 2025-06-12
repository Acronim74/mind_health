// src/app/api/user/answers/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as jose from "jose";

interface JwtPayload {
  sub: string;
  role: string;
}

interface AnswerPayload {
  question_id: number;
  answer_text?: string | null;
  answer_choice?: any;
  answer_number?: number | null;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Проверяем JWT в куки
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
    }
    let payload: JwtPayload;
    try {
      const { payload: pl } = await jose.jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET!)
      );
      payload = pl as JwtPayload;
    } catch {
      return NextResponse.json({ error: "Неверный токен" }, { status: 401 });
    }
    const userId = payload.sub;

    // 2. Читаем тело запроса
    const body = await request.json();
    const {
      questionnaire_id,
      user_answer_id: incomingUAId,
      answers,
    }: {
      questionnaire_id: number;
      user_answer_id?: string | null;
      answers: AnswerPayload[];
    } = body;

    if (typeof questionnaire_id !== "number" || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Некорректные данные запроса" },
        { status: 400 }
      );
    }

    // 3. Инициализируем Supabase (Service Role Key)
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Находим или создаём запись в user_answers
    let userAnswerId = incomingUAId || null;

    if (!userAnswerId) {
      // пробуем найти черновик
      const { data: existing, error: fetchErr } = await supabase
        .from("user_answers")
        .select("id")
        .eq("user_id", userId)
        .eq("questionnaire_id", questionnaire_id)
        .eq("is_submitted", false)
        .maybeSingle();
      if (fetchErr) {
        console.error("Ошибка поиска черновика:", fetchErr);
        return NextResponse.json(
          { error: "Внутренняя ошибка" },
          { status: 500 }
        );
      }
      if (existing) {
        userAnswerId = existing.id;
      } else {
        // создаём новый черновик
        const { data: inserted, error: insertErr } = await supabase
          .from("user_answers")
          .insert({
            user_id: userId,
            questionnaire_id,
            is_submitted: false,
          })
          .select("id")
          .single();
        if (insertErr || !inserted) {
          console.error("Ошибка создания user_answers:", insertErr);
          return NextResponse.json(
            { error: "Не удалось создать запись" },
            { status: 500 }
          );
        }
        userAnswerId = inserted.id;
      }
    }

    // 5. Удаляем старые детали (если есть) и вставляем новые
    const { error: delErr } = await supabase
      .from("user_answer_details")
      .delete()
      .eq("user_answer_id", userAnswerId);
    if (delErr) {
      console.error("Ошибка удаления старых ответов:", delErr);
      // не прерываем, попытаемся вставить новые
    }

    const detailsToInsert = answers.map((ans) => ({
      user_answer_id: userAnswerId,
      question_id: ans.question_id,
      answer_text: ans.answer_text ?? null,
      answer_choice: ans.answer_choice ?? null,
      answer_number: ans.answer_number ?? null,
    }));

    const { error: insertDetailsErr } = await supabase
      .from("user_answer_details")
      .insert(detailsToInsert);

    if (insertDetailsErr) {
      console.error("Ошибка вставки ответов:", insertDetailsErr);
      return NextResponse.json(
        { error: "Не удалось сохранить ответы" },
        { status: 500 }
      );
    }

    // 6. Возвращаем успех и id
    return NextResponse.json({
      success: true,
      user_answer_id: userAnswerId,
    });
  } catch (err) {
    console.error("Unexpected error in POST /api/user/answers:", err);
    return NextResponse.json(
      { error: "Неожиданная ошибка сервера" },
      { status: 500 }
    );
  }
}
