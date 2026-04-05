import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Navigation } from "@/components/navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "KetoBro - KI-gestützter Keto-Ernährungsassistent",
  description: "Dein persönlicher Begleiter für die ketogene Ernährung mit KI-Unterstützung",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Providers>
          <Navigation />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
