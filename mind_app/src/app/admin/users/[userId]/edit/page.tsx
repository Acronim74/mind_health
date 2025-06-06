// src/app/admin/users/[userId]/edit/page.tsx

import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import EditUserRoleForm from "@/components/EditUserRoleForm";

interface User {
  id: string;
  email: string;
  role: string;
}

interface PageParams {
  userId: string;
}

export default async function EditUserPage({ params }: { params: PageParams }) {
  const userId = params.userId;

  // 1) Получаем данные пользователя с сервером Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: user, error } = await supabase
    .from<User>("app_users")
    .select("id, email, role")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 min-h-screen">
      <div className="w-full max-w-lg bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-semibold mb-6">
          Редактировать пользователя
        </h2>
        <p className="mb-4 text-gray-700">
          <span className="font-medium">Email:</span> {user.email}
        </p>
        <EditUserRoleForm userId={user.id} initialRole={user.role} />
      </div>
    </div>
  );
}
