import type { Metadata } from "next";
import "./globals.css";

import AutoLock from "@/components/layout/AutoLock";
import VaultSessionProvider from "@/components/providers/VaultSessionProvider";

export const metadata: Metadata = {
  title: "NEXO Digital Pass",
  description:
    "بطاقتك الرقمية الآمنة لحفظ وإدارة جميع حساباتك بسهولة وأمان.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <VaultSessionProvider>
          <AutoLock />
          {children}
        </VaultSessionProvider>
      </body>
    </html>
  );
}