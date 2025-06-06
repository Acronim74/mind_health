// src/app/api/admin/users/[userId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as jose from "jose";

interface JwtPayload {
  sub: string;
  role: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    // 1) Проверяем JWT и извлекаем payload
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

    // 2) Только админ может менять роли (проверка роли)
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    // 3) Парсим тело { role }
    const { role } = await request.json();
    if (typeof role !== "string" || !["user", "subadmin", "admin"].includes(role)) {
      return NextResponse.json({ error: "Недопустимая роль" }, { status: 400 });
    }

    // 4) Не позволяем понизить самого себя (если payload.sub === userId)
    if (payload.sub === userId && role !== "admin") {
      return NextResponse.json(
        { error: "Нельзя изменить свою роль на более низкую" },
        { status: 400 }
      );
    }

    // 5) Обновляем роль в таблице app_users
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase
      .from("app_users")
      .update({ role })
      .eq("id", userId);

    if (error) {
      console.error("Ошибка при обновлении роли пользователя:", error);
      return NextResponse.json(
        { error: "Не удалось обновить роль" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Неожиданная ошибка PATCH /api/admin/users/[userId]:", err);
    return NextResponse.json(
      { error: "Неожиданная ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

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

    // 2) Только админ может удалять пользователей
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    // 3) Нельзя удалить самого себя
    if (payload.sub === userId) {
      return NextResponse.json(
        { error: "Нельзя удалить свой аккаунт" },
        { status: 400 }
      );
    }

    // 4) Удаляем пользователя из app_users
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase
      .from("app_users")
      .delete()
      .eq("id", userId);

    if (error) {
      console.error("Ошибка при удалении пользователя:", error);
      return NextResponse.json(
        { error: "Не удалось удалить пользователя" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Неожиданная ошибка DELETE /api/admin/users/[userId]:", err);
    return NextResponse.json(
      { error: "Неожиданная ошибка сервера" },
      { status: 500 }
    );
  }
}
