// src/app/api/admin/questionnaires/[questionnaireId]/prompt/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as jose from "jose";

// Initialize Supabase server client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify JWT and check for admin or subadmin role
async function verifyAdminToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) throw new Error("Unauthorized");
  const { payload } = await jose.jwtVerify(
    token,
    new TextEncoder().encode(process.env.JWT_SECRET!)
  );
  const user = payload as { sub: string; role: string };
  if (!(user.role === "admin" || user.role === "subadmin")) {
    throw new Error("Forbidden");
  }
  return user.sub;
}

// GET: Fetch existing prompt settings for an individual questionnaire
export async function GET(
  req: NextRequest,
  { params }: { params: { questionnaireId: string } }
) {
  try {
    await verifyAdminToken(req);
    const questionnaireId = Number(params.questionnaireId);
    const { data, error } = await supabase
      .from("analysis_prompts")
      .select(
        "role_text, tone_text, format_text, detail_level, goal_text"
      )
      .eq("questionnaire_id", questionnaireId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116: no rows returned
      throw error;
    }

    return NextResponse.json(data || null);
  } catch (err: any) {
    const status = err.message === "Unauthorized" ? 401 : err.message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// POST: Create or update prompt settings for a questionnaire
export async function POST(
  req: NextRequest,
  { params }: { params: { questionnaireId: string } }
) {
  try {
    await verifyAdminToken(req);
    const questionnaireId = Number(params.questionnaireId);
    const body = await req.json();
    const { role_text, tone_text, format_text, detail_level, goal_text } = body;

    if (!role_text || !tone_text) {
      return NextResponse.json(
        { error: "role_text and tone_text are required" },
        { status: 400 }
      );
    }

    // Upsert prompt settings
    const { error } = await supabase
      .from("analysis_prompts")
      .upsert({
        questionnaire_id: questionnaireId,
        role_text,
        tone_text,
        format_text: format_text || "",
        detail_level: detail_level || "",
        goal_text: goal_text || "",
        updated_at: new Date().toISOString(),
      }, { onConflict: 'questionnaire_id' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = err.message === "Unauthorized" ? 401 : err.message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
