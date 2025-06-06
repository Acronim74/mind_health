// src/app/api/admin/questionnaires/[questionnaireId]/questions/[questionId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as jose from "jose";

interface JwtPayload {
  sub: string;
  role: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { questionnaireId: string; questionId: string } }
) {
  const questionnaireId = Number(params.questionnaireId);
  const questionId = Number(params.questionId);

  // 1) Проверяем JWT
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

  // 2) Парсим тело
  const { text, type, is_required, order_index } = await request.json();

  // 3) Валидация
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

  // 4) Инициализируем Supabase с Service Role Key
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 5) Проверяем, что вопрос существует и соответствует анкете
  const { data: question, error: qErr } = await supabase
    .from("questions")
    .select("id, questionnaire_id")
    .eq("id", questionId)
    .single();
  if (qErr || !question || question.questionnaire_id !== questionnaireId) {
    return NextResponse.json({ error: "Вопрос не найден или не связан с этой анкетой." }, { status: 404 });
  }

  // 6) Обновляем
  const { error } = await supabase
    .from("questions")
    .update({
      text: text.trim(),
      type: type.trim(),
      is_required,
      order_index: orderIdx,
    })
    .eq("id", questionId);

  if (error) {
    console.error("Ошибка при обновлении вопроса:", error);
    return NextResponse.json({ error: "Не удалось обновить вопрос." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { questionnaireId: string; questionId: string } }
) {
  const questionnaireId = Number(params.questionnaireId);
  const questionId = Number(params.questionId);

  // Проверяем JWT
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }
  try {
    await jose.jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!));
  } catch {
    return NextResponse.json({ error: "Неверный токен" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Удаляем вопрос, убедившись, что он принадлежит нужной анкете
  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId)
    .eq("questionnaire_id", questionnaireId);

  if (error) {
    console.error("Ошибка при удалении вопроса:", error);
    return NextResponse.json({ error: "Не удалось удалить вопрос." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
