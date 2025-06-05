// src/app/admin/page.tsx
"use client";

export default function AdminPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Панель Администратора</h1>
      <p className="mb-6">
        Добро пожаловать, администратор! Здесь вы сможете управлять группами анкет, пользователями и т. д.
      </p>

      {/* Пример: ссылки на CRUD других сущностей */}
      <ul className="list-disc list-inside space-y-2">
        <li>
          <a href="/admin/groups" className="text-indigo-600 hover:underline">
            Управление группами анкет
          </a>
        </li>
        <li>
          <a href="/admin/questionnaires" className="text-indigo-600 hover:underline">
            Управление анкетами
          </a>
        </li>
        <li>
          <a href="/admin/users" className="text-indigo-600 hover:underline">
            Просмотр всех пользователей
          </a>
        </li>
        <li>
          <a href="/admin/contact-forms" className="text-indigo-600 hover:underline">
            Сообщения из «Связаться с админом»
          </a>
        </li>
      </ul>
    </div>
  );
}
