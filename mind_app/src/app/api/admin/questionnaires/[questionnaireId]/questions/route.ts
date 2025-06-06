// src/app/api/admin/questionnaires/[questionnaireId]/questions/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as jose from "jose";

interface JwtPayload {
  sub: string;
  role: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { questionnaireId: string } }
) {
  try {
    const questionnaireId = Number(params.questionnaireId);

    // 1. Проверяем JWT из куки и извлекаем payload
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
    }
    let payload: JwtPayload;
    try {
      const { payload: verified } = await jose.jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET!)
      );
      payload = verified as JwtPayload;
    } catch {
      return NextResponse.json({ error: "Неверный токен" }, { status: 401 });
    }

    // 2. Читаем тело запроса
    const { text, type, is_required, order_index } = await request.json();

    // 3. Простейшая валидация
    if (typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Текст вопроса обязателен." }, { status: 400 });
    }
    if (typeof type !== "string" || type.trim().length === 0) {
      return NextResponse.json({ error: "Тип вопроса обязателен." }, { status: 400 });
    }
    if (typeof is_required !== "boolean") {
      return NextResponse.json({ error: "Неверное значение для is_required." }, { status: 400 });
    }
    const orderIdx = typeof order_index === "number" ? order_index : 0;

    // 4. Инициализируем Supabase (Service Role Key)
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 5. Проверяем, что анкета существует
    const { data: qExists, error: qErr } = await supabase
      .from("questionnaires")
      .select("id")
      .eq("id", questionnaireId)
      .single();
    if (qErr || !qExists) {
      return NextResponse.json({ error: "Анкета не найдена." }, { status: 404 });
    }

    // 6. Вставляем новый вопрос, указывая created_by = payload.sub
    const { data, error } = await supabase
      .from("questions")
      .insert({
        questionnaire_id: questionnaireId,
        text: text.trim(),
        type: type.trim(),
        is_required,
        order_index: orderIdx,
        created_by: payload.sub, // <--- передаём сюда ID пользователя
      })
      .select("id")
      .single();

    if (error) {
      console.error("Ошибка при создании вопроса:", error);
      return NextResponse.json({ error: "Не удалось создать вопрос." }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("Неожиданная ошибка POST /questions:", err);
    return NextResponse.json({ error: "Неожиданная ошибка сервера." }, { status: 500 });
  }
}
