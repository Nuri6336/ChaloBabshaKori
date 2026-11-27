import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import "@fontsource/hind-siliguri/bengali-400.css";
import "@fontsource/hind-siliguri/bengali-500.css";
import "@fontsource/hind-siliguri/bengali-600.css";
import "@fontsource/hind-siliguri/bengali-700.css";
import "@fontsource/hind-siliguri/latin-400.css";
import "@fontsource/hind-siliguri/latin-500.css";
import "@fontsource/hind-siliguri/latin-600.css";
import "@fontsource/hind-siliguri/latin-700.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-800.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChaloBabshaKori.com – চলো ব্যবসা করি",
  description: "বাংলাদেশের ছোট ও মাঝারি ব্যবসার জন্য সম্পূর্ণ ডিজিটাল ব্যবসা ব্যবস্থাপনা প্ল্যাটফর্ম।",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <body>
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
