// src/app/admin/groups/[groupId]/edit/page.tsx
import React from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseClient";
import GroupSettings from "@/components/admin/GroupSettings";

interface PageParams {
  groupId: string;
}

export default async function EditGroupPage({ params }: { params: PageParams }) {
  // НЕ await params, читаем напрямую:
  const groupId = Number(params.groupId);

  // Проверяем аутентификацию
  const cookieStore = await cookies();
  if (!cookieStore.get("token")?.value) {
    redirect("/login");
  }

  // Загружаем данные группы
  const { data: group, error } = await supabaseAdmin
    .from("groups")
    .select("id, title, description, use_ai_analysis")
    .eq("id", groupId)
    .single();

  if (error || !group) {
    return notFound();
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Редактировать группу</h1>
      <form
        action={async (formData: FormData) => {
          "use server";
          const title = formData.get("title")?.toString() || "";
          const description = formData.get("description")?.toString() || "";
          await supabaseAdmin
            .from("groups")
            .update({ title, description })
            .eq("id", groupId);
          redirect(`/admin/groups/${groupId}`);
        }}
        className="space-y-4 bg-white p-6 rounded shadow"
      >
        <div>
          <label className="block font-medium">Название группы</label>
          <input
            name="title"
            defaultValue={group.title}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium">Описание группы</label>
          <textarea
            name="description"
            defaultValue={group.description || ""}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Сохранить
        </button>
      </form>

      <GroupSettings groupId={groupId} />
    </div>
  );
}
