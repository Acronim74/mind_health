// src/app/api/admin/questionnaires/[questionnaireId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as jose from "jose";

interface JwtPayload {
  sub: string;
  role: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { questionnaireId: string } }
) {
  const questionnaireId = Number(params.questionnaireId);

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
  const { title, description, purpose, result, group_id, is_active } = await request.json();

  // 3) Валидация
  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Название анкеты обязательно." }, { status: 400 });
  }
  if (typeof group_id !== "number") {
    return NextResponse.json({ error: "Неправильный идентификатор группы." }, { status: 400 });
  }
  // purpose и result могут быть пустыми

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // (Опционально) проверка прав: админ или автор анкеты
  /*
  const { data: record, error: recErr } = await supabase
    .from("questionnaires")
    .select("created_by")
    .eq("id", questionnaireId)
    .single();
  if (recErr || !record) {
    return NextResponse.json({ error: "Анкета не найдена" }, { status: 404 });
  }
  if (payload.role !== "admin" && payload.sub !== record.created_by) {
    return NextResponse.json({ error: "Нет прав на редактирование" }, { status: 403 });
  }
  */

  // 4) Выполняем update
  const { error } = await supabase
    .from("questionnaires")
    .update({
      title: title.trim(),
      description: description || null,
      purpose: purpose || null,
      result: result || null,
      group_id,
      is_active: Boolean(is_active),
    })
    .eq("id", questionnaireId);

  if (error) {
    console.error("Ошибка при обновлении анкеты:", error);
    return NextResponse.json({ error: "Не удалось обновить анкету." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { questionnaireId: string } }
) {
  const questionnaireId = Number(params.questionnaireId);

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

  // Удаляем анкету
  const { error } = await supabase.from("questionnaires").delete().eq("id", questionnaireId);

  if (error) {
    console.error("Ошибка при удалении анкеты:", error);
    return NextResponse.json({ error: "Не удалось удалить анкету." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
