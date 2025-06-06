// src/app/api/admin/groups/[groupId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as jose from "jose";

interface JwtPayload {
  sub: string;
  role: string;
}

export async function PATCH(request: NextRequest, { params }: { params: { groupId: string } }) {
  const groupId = Number(params.groupId);

  // 1) Читаем JWT из cookie
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

  // (Опционально) проверка прав: только админ или создатель группы
  // Если нужна логика, раскомментируйте и адаптируйте:
  /*
  const supabaseCheck = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: group, error: grpErr } = await supabaseCheck
    .from("groups")
    .select("created_by")
    .eq("id", groupId)
    .single();
  if (grpErr || !group) {
    return NextResponse.json({ error: "Группа не найдена" }, { status: 404 });
  }
  if (payload.role !== "admin" && payload.sub !== group.created_by) {
    return NextResponse.json({ error: "Нет прав на редактирование" }, { status: 403 });
  }
  */

  // 2) Парсим тело запроса
  const { title, description } = await request.json();

  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Название группы обязательно." }, { status: 400 });
  }

  // 3) Инициализируем Supabase-клиент с Service Role Key
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 4) Проводим обновление
  const { error } = await supabase
    .from("groups")
    .update({ title: title.trim(), description: description || null })
    .eq("id", groupId);

  if (error) {
    console.error("Ошибка при обновлении группы:", error);
    return NextResponse.json({ error: "Не удалось обновить группу." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { groupId: string } }) {
  const groupId = Number(params.groupId);

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

  // Удаляем группу
  const { error } = await supabase.from("groups").delete().eq("id", groupId);

  if (error) {
    console.error("Ошибка при удалении группы:", error);
    return NextResponse.json({ error: "Не удалось удалить группу." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
