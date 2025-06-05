// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    console.log("handleSubmit: старт");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("handleSubmit: получен ответ, status =", res.status);

      if (!res.ok) {
        const text = await res.text();
        console.log("handleSubmit: ошибка сервера:", text);
        setError(text || "Ошибка при входе");
        setLoading(false);
        return;
      }

      let data: { success: boolean; role: string };
      try {
        data = await res.json();
        console.log("handleSubmit: распарсен JSON:", data);
      } catch (parseErr) {
        const txt = await res.text();
        console.log("handleSubmit: невалидный JSON от /api/login:", txt);
        setError("Неверный ответ от сервера");
        setLoading(false);
        return;
      }

      // Перенаправляем в зависимости от роли:
      if (data.role === "admin") {
        console.log("handleSubmit: роль admin, redirect to /admin");
        router.push("/admin");
      } else {
        console.log("handleSubmit: роль user, redirect to /dashboard");
        router.push("/dashboard");
      }
    } catch (networkError) {
      console.error("handleSubmit: сетевая ошибка при логине:", networkError);
      setError("Не удалось связаться с сервером");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <h1 className="text-3xl font-bold mb-6">Вход</h1>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded shadow"
      >
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Загрузка..." : "Войти"}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Ещё нет аккаунта?{" "}
        <a href="/register" className="text-indigo-600 hover:underline">
          Зарегистрироваться
        </a>
      </p>
    </div>
  );
}
