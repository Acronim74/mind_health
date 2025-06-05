// src/app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    if (
      typeof email !== "string" ||
      !email.includes("@") ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { error: "Некорректный email или пароль." },
        { status: 400 }
      );
    }

    // Ищем пользователя по email
    const { data: user, error: fetchError } = await supabase
      .from("app_users")
      .select("id, email, password_hash, role")
      .eq("email", email)
      .maybeSingle();

    if (fetchError) {
      console.error("Ошибка при поиске пользователя:", fetchError);
      return NextResponse.json(
        { error: "Внутренняя ошибка при поиске пользователя." },
        { status: 500 }
      );
    }
    if (!user) {
      return NextResponse.json(
        { error: "Неверный email или пароль." },
        { status: 401 }
      );
    }

    // Сравниваем пароль с хэшем
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Неверный email или пароль." },
        { status: 401 }
      );
    }

    // Генерируем JWT
    const jwt = await generateJwt(user.id, user.role);

    // Отдаём роль вместе с success
    const response = NextResponse.json({ success: true, role: user.role });
    response.cookies.set({
      name: "token",
      value: jwt,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Неизвестная ошибка при входе." },
      { status: 500 }
    );
  }
}
