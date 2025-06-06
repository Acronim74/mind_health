// src/app/api/admin/questionnaires/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as jose from "jose";

interface JwtPayload {
  sub: string;
  role: string;
}

export async function POST(request: NextRequest) {
  try {
    // Проверка JWT (как раньше)
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

    // Читаем JSON-тяло
    const { title, description, purpose, result, group_id, is_active } = await request.json();

    // Валидация
    if (typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Название анкеты обязательно." }, { status: 400 });
    }
    if (typeof group_id !== "number") {
      return NextResponse.json({ error: "Неправильный идентификатор группы." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Вставка сразу с order_index = 1
    const { data, error } = await supabase
      .from("questionnaires")
      .insert({
        title: title.trim(),
        description: description || null,
        purpose: purpose || null,
        result: result || null,
        group_id,
        is_active: Boolean(is_active),
        created_by: payload.sub,
        order_index: 1,   // <— добавляем сюда фиксированное значение
      })
      .select("id")
      .single();

    if (error) {
      console.error("Ошибка при создании анкеты:", error);
      return NextResponse.json({ error: "Не удалось создать анкету." }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("Неожиданная ошибка POST /api/admin/questionnaires:", err);
    return NextResponse.json({ error: "Неожиданная ошибка сервера." }, { status: 500 });
  }
}
