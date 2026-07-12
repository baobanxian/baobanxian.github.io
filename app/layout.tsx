import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "@/app/components/nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://baobanxian.com";

export const metadata: Metadata = {
  title: "张方宇 - 个人主页",
  description: "南京大学 软工经济创新班 张方宇的个人主页",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "张方宇 - 个人主页",
    description: "南京大学 软工经济创新班 张方宇的个人主页",
    url: siteUrl,
    siteName: "张方宇",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "张方宇 - 个人主页",
    description: "南京大学 软工经济创新班 张方宇的个人主页",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-dvh flex flex-col bg-gradient-to-br from-sky-50 via-stone-50 to-gray-100">
        <Nav />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
