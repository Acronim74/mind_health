// src/app/api/admin/questionnaires/[questionnaireId]/settings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as jose from "jose";

// Инициализация Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Проверка JWT и роли
async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) throw new Error("Unauthorized");
  const { payload } = await jose.jwtVerify(
    token,
    new TextEncoder().encode(process.env.JWT_SECRET!)
  );
  const user = payload as { sub: string; role: string };
  if (user.role !== "admin" && user.role !== "subadmin") {
    throw new Error("Forbidden");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { questionnaireId: string } }
) {
  try {
    await verifyAdmin(req);
    const qId = Number(params.questionnaireId);
    const { use_ai_analysis } = await req.json();
    if (typeof use_ai_analysis !== "boolean") {
      return NextResponse.json(
        { error: "use_ai_analysis must be boolean" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("questionnaires")
      .update({ use_ai_analysis })
      .eq("id", qId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status =
      err.message === "Unauthorized"
        ? 401
        : err.message === "Forbidden"
        ? 403
        : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
