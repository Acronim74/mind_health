// src/components/EditUserRoleForm.tsx

"use client";

import { FC, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface EditUserRoleFormProps {
  userId: string;
  initialRole: string;
}

const EditUserRoleForm: FC<EditUserRoleFormProps> = ({
  userId,
  initialRole,
}) => {
  const router = useRouter();
  const [role, setRole] = useState(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (role.trim().length === 0) {
      setError("Роль не может быть пустой");
      return;
    }
    if (!["user", "subadmin", "admin"].includes(role)) {
      setError("Недопустимая роль");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || "Не удалось изменить роль");
        setLoading(false);
        return;
      }
      // После успешного обновления возвращаемся к списку пользователей
      router.push("/admin/users");
    } catch (networkError) {
      console.error("Ошибка при запросе:", networkError);
      setError("Не удалось изменить роль (сетевая ошибка)");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1">
          Роль пользователя
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="user">user</option>
          <option value="subadmin">subadmin</option>
          <option value="admin">admin</option>
        </select>
      </div>

      <div className="flex justify-between items-center">
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Сохраняю..." : "Сохранить"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/users")}
          className="text-gray-600 hover:underline"
        >
          Отмена
        </button>
      </div>
    </form>
  );
};

export default EditUserRoleForm;
