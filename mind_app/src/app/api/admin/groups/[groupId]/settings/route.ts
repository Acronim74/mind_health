// src/app/api/admin/groups/[groupId]/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(_: NextRequest, { params }: { params: { groupId: string } }) {
  const id = Number(params.groupId);
  const { data, error } = await supabaseAdmin
    .from("groups")
    .select("use_ai_analysis")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: { groupId: string } }) {
  const id = Number(params.groupId);
  const { use_ai_analysis } = await request.json();
  const { error } = await supabaseAdmin
    .from("groups")
    .update({ use_ai_analysis })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
