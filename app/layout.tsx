import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduFlow - AI 驱动每日知识卡片",
  description: "您的个性化 AI 助教",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased font-sans bg-slate-50">
        {children}
      </body>
    </html>
  );
}
