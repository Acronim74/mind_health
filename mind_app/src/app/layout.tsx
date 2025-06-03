// src/app/layout.tsx

import "./globals.css";
import Providers from "./Providers";

// 1) Добавьте эту строку сразу после импорта Providers:
import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Метаданные */}
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>My Mental Health App</title>
        <meta
          name="description"
          content="Приложение для психического здоровья с анкетами и AI-анализом."
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-gray-50">
        {/* 2) Вставляем Navbar прямо здесь, перед Providers */}
        <Navbar />

        {/* Клиентский провайдер для сессий Supabase */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
