// src/app/api/admin/groups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as jose from "jose";

// Service Role Key, чтобы обойти RLS на сервере
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // 1) Вытаскиваем JWT из cookie
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
    }

    let payload;
    try {
      // 2) Верифицируем JWT и читаем payload
      const { payload: verifiedPayload } = await jose.jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET!)
      );
      payload = verifiedPayload as { sub: string; role: string };
    } catch {
      return NextResponse.json({ error: "Неверный токен" }, { status: 401 });
    }

    // 3) Дёргаем из payload userId (тот, кто создал request)
    const userId = payload.sub;
    // Опционально проверяем роль payload.role === "admin" или "subadmin", если нужен доп. контроль

    // 4) Парсим тело запроса
    const { title, description } = await request.json();

    // 5) Валидация названия
    if (typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Название группы обязательно." }, { status: 400 });
    }

    // 6) Делаем INSERT, передавая created_by = userId
    const { data, error } = await supabase
      .from("groups")
      .insert({
        title: title.trim(),
        description: description || null,
        created_by: userId,      // <— вот здесь заполняем поле
      })
      .select("id")
      .single();

    if (error) {
      console.error("Ошибка при вставке группы:", error);
      return NextResponse.json({ error: "Не удалось создать группу." }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("Неожиданная ошибка в POST /api/admin/groups:", err);
    return NextResponse.json({ error: "Неожиданная ошибка сервера." }, { status: 500 });
  }
}
