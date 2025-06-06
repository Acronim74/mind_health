// src/app/dashboard/page.tsx

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
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

// Функция для верификации JWT и извлечения payload
async function verifyJwt(token: string): Promise<JwtPayload> {
  const { payload } = await jose.jwtVerify(
    token,
    new TextEncoder().encode(process.env.JWT_SECRET!)
  );
  return payload as JwtPayload;
}

export default async function DashboardPage(props: PageProps) {
  // 1) Получаем токен из cookie
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get("token");
  if (!tokenCookie) {
    // Если токена нет, перенаправляем на страницу логина
    redirect("/login");
  }

  let payload: JwtPayload;
  try {
    payload = await verifyJwt(tokenCookie.value);
  } catch {
    // Если токен невалидный, редирект на логин
    redirect("/login");
  }

  const userId = payload.sub;

  // 2) Инициализируем Supabase на сервере (Service Role Key)
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3) Загружаем все группы
  const { data: groupsData, error: groupsErr } = await supabase
    .from<GroupInfo>("groups")
    .select("id, title, description")
    .order("title", { ascending: true });

  if (groupsErr) {
    console.error("Ошибка при загрузке групп:", groupsErr);
    // Можно либо показать ошибку, либо вернуть notFound()
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-4">Ваш кабинет</h2>
        <p className="text-red-500">Не удалось загрузить группы.</p>
      </div>
    );
  }

  const groups: GroupInfo[] = groupsData || [];

  // 4) Загружаем все анкеты (id + group_id)
  const { data: questionnairesData, error: quesErr } = await supabase
    .from<QuestionnaireInfo>("questionnaires")
    .select("id, group_id");

  if (quesErr) {
    console.error("Ошибка при загрузке анкет:", quesErr);
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-4">Ваш кабинет</h2>
        <p className="text-red-500">Не удалось загрузить анкеты.</p>
      </div>
    );
  }

  const questionnaires: QuestionnaireInfo[] = questionnairesData || [];

  // 5) Загружаем все отправленные (is_submitted = true) ответы текущего пользователя
  const { data: userAnswersData, error: uaErr } = await supabase
    .from<UserAnswerInfo>("user_answers")
    .select("questionnaire_id")
    .eq("user_id", userId)
    .eq("is_submitted", true);

  if (uaErr) {
    console.error("Ошибка при загрузке ответов пользователя:", uaErr);
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-4">Ваш кабинет</h2>
        <p className="text-red-500">Не удалось загрузить ваши ответы.</p>
      </div>
    );
  }

  const userAnswers: UserAnswerInfo[] = userAnswersData || [];

  // 6) Строим карты: для каждой группы — сколько всего анкет и сколько уже пройдено
  const totalPerGroup = new Map<number, number>();
  for (const q of questionnaires) {
    totalPerGroup.set(q.group_id, (totalPerGroup.get(q.group_id) || 0) + 1);
  }

  // Считаем, какие questionnaire_id уже отправлены
  const answeredSet = new Set<number>(
    userAnswers.map((ua) => ua.questionnaire_id)
  );
  // Теперь считаем priled per group
  const completedPerGroup = new Map<number, number>();
  for (const q of questionnaires) {
    if (answeredSet.has(q.id)) {
      completedPerGroup.set(
        q.group_id,
        (completedPerGroup.get(q.group_id) || 0) + 1
      );
    }
  }

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
