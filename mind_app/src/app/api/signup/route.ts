// src/app/api/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";

// Инициализация Supabase с service_role (чтобы писать в свои таблицы)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Функция генерации JWT (если вы их используете)
async function generateJwt(userId: string, role: string) {
  const alg = "HS256";
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  const token = await new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  return token;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    // Простейшая валидация
    if (
      typeof email !== "string" ||
      !email.includes("@") ||
      typeof password !== "string" ||
      password.length < 6
    ) {
      return NextResponse.json(
        { error: "Email или пароль некорректны (минимум 6 символов)" },
        { status: 400 }
      );
    }

    // Проверяем, нет ли уже такого email
    const { data: existing, error: fetchError } = await supabase
      .from("app_users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (fetchError) {
      console.error("Ошибка при проверке пользователя:", fetchError);
      return NextResponse.json(
        { error: "Внутренняя ошибка сервера" },
        { status: 500 }
      );
    }
    if (existing) {
      return NextResponse.json(
        { error: "Пользователь с этим email уже существует" },
        { status: 400 }
      );
    }

    // Хэшируем пароль
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Создаём пользователя в таблице app_users
    const { data: newUser, error: insertError } = await supabase
      .from("app_users")
      .insert({ email, password_hash: hash, role: "user" })
      .select("id, role")
      .single();

    if (insertError) {
      console.error("Ошибка при создании пользователя:", insertError);
      return NextResponse.json(
        { error: "Не удалось создать пользователя" },
        { status: 500 }
      );
    }

    // Генерируем JWT (опционально)
    const jwt = await generateJwt(newUser.id, newUser.role);

    // Устанавливаем куки с JWT
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: "token",
      value: jwt,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (err) {
    console.error("Неожиданная ошибка в POST /api/signup:", err);
    return NextResponse.json(
      { error: "Неожиданная ошибка на сервере" },
      { status: 500 }
    );
  }
}
