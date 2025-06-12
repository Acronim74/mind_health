// src/app/dashboard/page.tsx

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import * as jose from "jose";

interface JwtPayload {
  sub: string;
  role: string;
}

interface GroupInfo {
  id: number;
  title: string;
  description: string | null;
}

interface QuestionnaireInfo {
  id: number;
  group_id: number;
}

interface UserAnswerInfo {
  questionnaire_id: number;
}

interface PageProps {}

async function verifyJwt(token: string): Promise<JwtPayload> {
  const { payload } = await jose.jwtVerify(
    token,
    new TextEncoder().encode(process.env.JWT_SECRET!)
  );
  return payload as JwtPayload;
}

export default async function DashboardPage(props: PageProps) {
  // 1) асинхронно получаем куки
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("token")?.value;
  if (!tokenCookie) {
    return redirect("/login");
  }

  // 2) верификация токена
  let payload: JwtPayload;
  try {
    payload = await verifyJwt(tokenCookie);
  } catch {
    return redirect("/login");
  }
  const userId = payload.sub;

  // 3) инициализация Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 4) загрузка групп
  const { data: groupsData, error: groupsErr } = await supabase
    .from<GroupInfo>("groups")
    .select("id, title, description")
    .order("title", { ascending: true });
  if (groupsErr) {
    console.error("Ошибка при загрузке групп:", groupsErr);
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-4">Ваш кабинет</h2>
        <p className="text-red-500">Не удалось загрузить группы.</p>
      </div>
    );
  }
  const groups = groupsData || [];

  // 5) загрузка анкет и ответов
  const { data: questionnairesData } = await supabase
    .from<QuestionnaireInfo>("questionnaires")
    .select("id, group_id");
  const questionnaires = questionnairesData || [];

  const { data: userAnswersData } = await supabase
    .from<UserAnswerInfo>("user_answers")
    .select("questionnaire_id")
    .eq("user_id", userId)
    .eq("is_submitted", true);
  const userAnswers = userAnswersData || [];

  // 6) подсчёт прогресса
  const totalPerGroup = new Map<number, number>();
  questionnaires.forEach((q) => {
    totalPerGroup.set(q.group_id, (totalPerGroup.get(q.group_id) || 0) + 1);
  });
  const answeredSet = new Set(userAnswers.map((ua) => ua.questionnaire_id));
  const completedPerGroup = new Map<number, number>();
  questionnaires.forEach((q) => {
    if (answeredSet.has(q.id)) {
      completedPerGroup.set(
        q.group_id,
        (completedPerGroup.get(q.group_id) || 0) + 1
      );
    }
  });

  // 7) рендер
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-6">Ваш кабинет</h2>
      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((g) => {
            const total = totalPerGroup.get(g.id) || 0;
            const completed = completedPerGroup.get(g.id) || 0;
            return (
              <div
                key={g.id}
                className="bg-white p-6 rounded shadow hover:shadow-md transition"
              >
                <h3 className="text-xl font-semibold mb-2">{g.title}</h3>
                <p className="mb-4 text-gray-700">
                  {g.description || "Описание отсутствует."}
                </p>
                <p className="mb-4 text-gray-600">
                  Пройдено анкет:{" "}
                  <span className="font-medium">
                    {completed} / {total}
                  </span>
                </p>
                <Link href={`/dashboard/groups/${g.id}`}>
                  <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded">
                    Перейти к анкетам
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500">Группы не найдены.</p>
      )}
    </div>
  );
}
