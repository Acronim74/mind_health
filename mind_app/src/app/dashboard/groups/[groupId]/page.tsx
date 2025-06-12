// src/app/dashboard/groups/[groupId]/page.tsx

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import * as jose from "jose";

interface JwtPayload {
  sub: string;
  role: string;
}

interface QuestionnaireRow {
  id: number;
  title: string;
  description: string | null;
}

interface UserAnswerInfo {
  questionnaire_id: number;
  is_submitted: boolean;
}

interface PageParams {
  groupId: string;
}

async function verifyJwt(token: string): Promise<JwtPayload> {
  const { payload } = await jose.jwtVerify(
    token,
    new TextEncoder().encode(process.env.JWT_SECRET!)
  );
  return payload as JwtPayload;
}

export default async function GroupQuestionnairesPage({
  params,
}: {
  params: PageParams;
}) {
  // 1) await params
  const { groupId: groupIdStr } = await params;
  const groupId = Number(groupIdStr);

  // 2) await cookies()
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("token")?.value;
  if (!tokenCookie) redirect("/login");

  // 3) verify JWT
  let payload: JwtPayload;
  try {
    payload = await verifyJwt(tokenCookie);
  } catch {
    redirect("/login");
  }
  const userId = payload.sub;

  // 4) init supabase
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 5) check group exists
  const { data: grp, error: grpErr } = await supabase
    .from("groups")
    .select("id")
    .eq("id", groupId)
    .single();
  if (grpErr || !grp) return notFound();

  // 6) load questionnaires
  const { data: qs, error: qErr } = await supabase
    .from<QuestionnaireRow>("questionnaires")
    .select("id, title, description")
    .eq("group_id", groupId)
    .order("order_index", { ascending: true });
  if (qErr) {
    console.error("Ошибка при загрузке анкет:", qErr);
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-4">Анкеты группы</h2>
        <p className="text-red-500">Не удалось загрузить анкеты.</p>
      </div>
    );
  }
  const questionnaires = qs || [];

  if (questionnaires.length === 0) {
    return (
      <div className="p-8">
        <Link href="/dashboard">
          <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mb-6">
            ← Назад к группам
          </button>
        </Link>
        <h2 className="text-2xl font-semibold mb-4">Анкеты группы</h2>
        <p className="text-gray-500">В этой группе ещё нет анкет.</p>
      </div>
    );
  }

  // 7) load user answers
  const ids = questionnaires.map((q) => q.id);
  const { data: uaData, error: uaErr } = await supabase
    .from<UserAnswerInfo>("user_answers")
    .select("questionnaire_id, is_submitted")
    .eq("user_id", userId)
    .in("questionnaire_id", ids);
  if (uaErr) {
    console.error("Ошибка при загрузке ответов пользователя:", uaErr);
    return (
      <div className="p-8">
        <Link href="/dashboard">
          <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mb-6">
            ← Назад к группам
          </button>
        </Link>
        <p className="text-red-500">Не удалось загрузить ваши ответы.</p>
      </div>
    );
  }
  const userAnswers = uaData || [];

  const answerMap = new Map<number, boolean>();
  userAnswers.forEach((ua) =>
    answerMap.set(ua.questionnaire_id, ua.is_submitted)
  );

  type QWithStatus = QuestionnaireRow & { status: string };
  const listWithStatus: QWithStatus[] = questionnaires.map((q) => {
    if (!answerMap.has(q.id)) {
      return { ...q, status: "not-started" };
    }
    return { ...q, status: answerMap.get(q.id) ? "completed" : "in-progress" };
  });

  // 8) render
  return (
    <div className="p-8">
      <Link href="/dashboard">
        <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mb-6">
          ← Назад к группам
        </button>
      </Link>
      <h2 className="text-2xl font-semibold mb-4">Анкеты группы</h2>
      <div className="space-y-6">
        {listWithStatus.map((q) => {
          let btnText = "";
          let btnHref = "";
          if (q.status === "not-started" || q.status === "in-progress") {
            btnText = q.status === "not-started" ? "Начать" : "Продолжить";
            btnHref = `/dashboard/questionnaires/${q.id}/start`;
          } else {
            btnText = "Посмотреть результаты";
            btnHref = `/dashboard/questionnaires/${q.id}/review`;
          }
          return (
            <div
              key={q.id}
              className="bg-white p-6 rounded shadow hover:shadow-md transition"
            >
              <h3 className="text-xl font-semibold mb-2">{q.title}</h3>
              {q.description && (
                <p className="mb-4 text-gray-700">{q.description}</p>
              )}
              <p className="mb-4 text-gray-600">
                Статус:{" "}
                <span className="font-medium">
                  {q.status === "not-started"
                    ? "Не начата"
                    : q.status === "in-progress"
                    ? "В процессе"
                    : "Пройдена"}
                </span>
              </p>
              <Link href={btnHref}>
                <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded">
                  {btnText}
                </button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
