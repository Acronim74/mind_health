// src/app/layout.tsx
import "./globals.css";
import Providers from "./Providers";

/**
 * Корневой layout — Server Component.
 * Здесь подключаются общие стили и клиентский провайдер (через <Providers>).
 * Дополнительно можно указать метаданные страницы (title, description и т. п.).
 */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Основные метатеги */}
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
        {/* Фавикон */}
        <link rel="icon" href="/favicon.ico" />
        {/* Здесь можно добавить дополнительные шрифты или ссылки на внешние стили */}
      </head>
      <body>
        {/* Клиентский провайдер для сессии Supabase */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
