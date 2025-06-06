// src/app/admin/groups/[groupId]/edit/page.tsx
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import EditGroupForm from "@/components/EditGroupForm";

interface Group {
  id: number;
  title: string;
  description: string | null;
}

interface PageParams {
  groupId: string;
}

export default async function EditGroupPage({ params }: { params: PageParams }) {
  const groupId = Number(params.groupId);

  // Серверный Supabase-клиент
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Получаем текущие данные группы
  const { data: group, error } = await supabase
    .from<Group>("groups")
    .select("id, title, description")
    .eq("id", groupId)
    .single();

  if (error || !group) {
    return notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 min-h-screen">
      <div className="w-full max-w-lg bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-semibold mb-6">Редактировать группу</h2>
        {/* Передаём начальные данные и ID */}
        <EditGroupForm
          initialTitle={group.title}
          initialDescription={group.description || ""}
          groupId={group.id}
        />
      </div>
    </div>
  );
}
